// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { VERBOSITY_CONFIG } from '../../types/src/index.ts';
import type { ExplainerPlan, EvidencePacket } from '../../types/src/index.ts';
import { silentLogger } from '../src/pipeline/_test-fixtures.ts';
import { makeFile, makePrInput } from '../src/pipeline/_test-fixtures.ts';
import { runStage0 } from '../src/pipeline/stage-0-fetch-triage.ts';
import { runStage2 } from '../src/pipeline/stage-2-structure.ts';
import type { Stage1Output } from '../src/pipeline/types.ts';
import { applyVerbosityToPrompt, resolveVerbosity } from '../src/pipeline/verbosity.ts';
import { makeNullModel } from '../src/providers/null-adapter.ts';

describe('resolveVerbosity', () => {
  test('returns explicit verbosity when set', () => {
    expect(resolveVerbosity({ verbosity: 'detailed' })).toBe('detailed');
    expect(resolveVerbosity({ verbosity: 'standard' })).toBe('standard');
    expect(resolveVerbosity({ verbosity: 'concise' })).toBe('concise');
  });

  test('falls back to concise when brief=true and verbosity unset', () => {
    expect(resolveVerbosity({ brief: true })).toBe('concise');
  });

  test('defaults to standard when both unset', () => {
    expect(resolveVerbosity({})).toBe('standard');
  });

  test('verbosity takes precedence over brief', () => {
    expect(resolveVerbosity({ brief: true, verbosity: 'detailed' })).toBe('detailed');
    expect(resolveVerbosity({ brief: true, verbosity: 'standard' })).toBe('standard');
  });

  test('brief=false alone resolves to standard', () => {
    expect(resolveVerbosity({ brief: false })).toBe('standard');
  });
});

describe('applyVerbosityToPrompt', () => {
  test('returns prompt unchanged for standard', () => {
    const prompt = 'Produce a 100-150 words paragraph.';
    expect(applyVerbosityToPrompt(prompt, 'standard')).toBe(prompt);
  });

  test('halves word ranges for concise rounded to nearest 10', () => {
    const out = applyVerbosityToPrompt('Produce 100-150 words.', 'concise');
    expect(out).toBe('Produce 50-80 words.');
  });

  test('doubles word ranges for detailed rounded to nearest 10', () => {
    const out = applyVerbosityToPrompt('Produce 100-150 words.', 'detailed');
    expect(out).toBe('Produce 200-300 words.');
  });

  test('scales multiple ranges in same prompt', () => {
    const prompt = 'First 200-300 words, then 50-80 words.';
    expect(applyVerbosityToPrompt(prompt, 'concise')).toBe(
      'First 100-150 words, then 30-40 words.',
    );
    expect(applyVerbosityToPrompt(prompt, 'detailed')).toBe(
      'First 400-600 words, then 100-160 words.',
    );
  });

  test('leaves prompts with no word range untouched', () => {
    const prompt = 'No word range here. Just plain guidance.';
    expect(applyVerbosityToPrompt(prompt, 'detailed')).toBe(prompt);
    expect(applyVerbosityToPrompt(prompt, 'concise')).toBe(prompt);
  });

  test('clamps minimum scaled value to 10 to avoid 0-word ranges', () => {
    expect(applyVerbosityToPrompt('Produce 5-10 words.', 'concise')).toBe('Produce 10-10 words.');
  });
});

describe('VERBOSITY_CONFIG invariants', () => {
  test('locked values match spec', () => {
    expect(VERBOSITY_CONFIG.concise).toEqual({
      sections: [3, 4],
      wordMult: 0.5,
      maxTokens: 200,
      allowDiagrams: 0,
    });
    expect(VERBOSITY_CONFIG.standard).toEqual({
      sections: [4, 6],
      wordMult: 1.0,
      maxTokens: 500,
      allowDiagrams: 1,
    });
    expect(VERBOSITY_CONFIG.detailed).toEqual({
      sections: [5, 7],
      wordMult: 2.0,
      maxTokens: 1200,
      allowDiagrams: 3,
    });
  });
});

function packet(id = 'pkt-a', path = 'src/a.ts'): EvidencePacket {
  return {
    id,
    path,
    symbols: ['fn'],
    summary: 'Stuff changed.',
    riskSignals: [],
    importance: 0.9,
    citations: [{ file: path, lineStart: 1, lineEnd: 2, kind: 'code' }],
  };
}

function stage1(...packets: EvidencePacket[]): Stage1Output {
  return {
    evidenceGraph: {
      packets: Object.fromEntries(packets.map((p) => [p.id, p])),
      citations: packets.flatMap((p) => p.citations),
      lookupByFile: Object.fromEntries(packets.map((p) => [p.path, [p.id]])),
    },
    tokensIn: 1,
    tokensOut: 1,
    costUsd: 0,
    cacheHits: 0,
    durationMs: 0,
  };
}

function planForVerbosity(numSections: number): Omit<ExplainerPlan, 'schemaVersion'> {
  const sections = Array.from({ length: numSections }, (_, idx) => ({
    id: `sec-${idx}`,
    title: `Section ${idx}`,
    importance: 'supporting' as const,
    sectionType: idx === 0 ? ('overview' as const) : ('narrative' as const),
    files: ['src/a.ts'],
    evidencePacketIds: ['pkt-a'],
  }));
  return {
    title: 'Title',
    summary: 'Summary',
    sections,
    collapsedFiles: [],
    diagramSpecs: [],
    risks: [],
  };
}

describe('Stage 2 verbosity gating', () => {
  test('concise produces section counts within [3, 4]', async () => {
    const s0 = await runStage0(makePrInput([makeFile({ path: 'src/a.ts' })]), {
      cache: { get: async () => {} },
      logger: silentLogger,
      model: 'null',
    });
    expect(s0.kind).toBe('ok');
    if (s0.kind !== 'ok') return;

    const out = await runStage2(
      s0,
      stage1(packet()),
      {
        logger: silentLogger,
        provider: 'anthropic',
        reasoningModel: makeNullModel({ json: planForVerbosity(3) }),
      },
      { verbosity: 'concise' },
    );
    expect(out.plan.sections.length).toBeGreaterThanOrEqual(3);
    expect(out.plan.sections.length).toBeLessThanOrEqual(4);
    expect(out.fellBackToMinimal).toBe(false);
  });

  test('detailed accepts up to 7 sections', async () => {
    const s0 = await runStage0(makePrInput([makeFile({ path: 'src/a.ts' })]), {
      cache: { get: async () => {} },
      logger: silentLogger,
      model: 'null',
    });
    expect(s0.kind).toBe('ok');
    if (s0.kind !== 'ok') return;

    const out = await runStage2(
      s0,
      stage1(packet()),
      {
        logger: silentLogger,
        provider: 'anthropic',
        reasoningModel: makeNullModel({ json: planForVerbosity(7) }),
      },
      { verbosity: 'detailed' },
    );
    expect(out.plan.sections.length).toBe(7);
    expect(out.fellBackToMinimal).toBe(false);
  });

  test('concise rejects an 8-section plan (exceeds max=4) and falls back to minimal', async () => {
    const s0 = await runStage0(makePrInput([makeFile({ path: 'src/a.ts' })]), {
      cache: { get: async () => {} },
      logger: silentLogger,
      model: 'null',
    });
    expect(s0.kind).toBe('ok');
    if (s0.kind !== 'ok') return;

    const out = await runStage2(
      s0,
      stage1(packet()),
      {
        logger: silentLogger,
        provider: 'anthropic',
        reasoningModel: makeNullModel({ json: planForVerbosity(7) }),
      },
      { verbosity: 'concise' },
    );
    expect(out.fellBackToMinimal).toBe(true);
  });
});
