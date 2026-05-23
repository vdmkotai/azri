// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import type { EvidencePacket, ExplainerPlan } from '../../../types/src/index.ts';
import { ExplainerPlanSchema } from '../../../types/src/schemas.ts';
import { makeNullModel, makeSequencedNullModel } from '../providers/null-adapter.ts';
import { makeFile, makePrInput, silentLogger } from './_test-fixtures.ts';
import { runStage0 } from './stage-0-fetch-triage.ts';
import { runStage2 } from './stage-2-structure.ts';
import type { Stage1Output, Stage2Deps } from './types.ts';

function packet(id = 'pkt-a', path = 'src/a.ts'): EvidencePacket {
  return {
    id,
    path,
    symbols: ['makeThing'],
    summary: 'Adds thing creation.',
    riskSignals: ['api-contract'],
    importance: 0.9,
    citations: [{ file: path, lineStart: 1, lineEnd: 2, kind: 'code' }],
  };
}

function stage1(...packets: EvidencePacket[]): Stage1Output {
  const entries = packets.map((p) => [p.id, p] as const);
  return {
    evidenceGraph: {
      packets: Object.fromEntries(entries),
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

function validPlan(overrides: Partial<ExplainerPlan> = {}): Omit<ExplainerPlan, 'schemaVersion'> {
  return {
    title: 'Add thing',
    summary: 'A small API addition.',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        importance: 'critical',
        sectionType: 'overview',
        files: ['src/a.ts'],
        evidencePacketIds: ['pkt-a'],
      },
      {
        id: 'narrative',
        title: 'Narrative',
        importance: 'important',
        sectionType: 'narrative',
        files: ['src/a.ts'],
        evidencePacketIds: ['pkt-a'],
      },
      {
        id: 'risk',
        title: 'Risk',
        importance: 'important',
        sectionType: 'risk-callouts',
        files: ['src/a.ts'],
        evidencePacketIds: ['pkt-a'],
        diagramId: 'd1',
      },
      {
        id: 'next',
        title: 'Next',
        importance: 'supporting',
        sectionType: 'next-steps',
        files: [],
        evidencePacketIds: [],
      },
    ],
    collapsedFiles: [],
    diagramSpecs: [{ id: 'd1', kind: 'mermaid-flow', mermaidSource: 'graph TD; A-->B' }],
    risks: [
      {
        severity: 'warn',
        category: 'api-contract',
        summary: 'Contract changed.',
        citations: [{ file: 'src/a.ts', lineStart: 1, lineEnd: 2, kind: 'code' }],
      },
    ],
    ...overrides,
  };
}

async function stage0() {
  return runStage0(makePrInput([makeFile({ path: 'src/a.ts' })]), {
    cache: { get: async () => {} },
    logger: silentLogger,
    model: 'null',
  });
}

function deps(json: unknown): Stage2Deps {
  return { logger: silentLogger, provider: 'anthropic', reasoningModel: makeNullModel({ json }) };
}

describe('runStage2 — structure extraction', () => {
  test('accepts valid Zod-shaped plan with <=1 diagram per page', async () => {
    const s0 = await stage0();
    expect(s0.kind).toBe('ok');
    if (s0.kind !== 'ok') return;

    const out = await runStage2(s0, stage1(packet()), deps(validPlan()));
    expect(ExplainerPlanSchema.parse(out.plan).schemaVersion).toBe(1);
    expect(out.plan.diagramSpecs).toHaveLength(1);
    expect(out.fellBackToMinimal).toBe(false);
  });

  test('passes Anthropic jsonTool structured output mode to the model', async () => {
    const s0 = await stage0();
    expect(s0.kind).toBe('ok');
    if (s0.kind !== 'ok') return;

    let mode: unknown;
    const model = makeNullModel({ json: validPlan() });
    const original = model.doGenerate.bind(model);
    model.doGenerate = async (options) => {
      mode = options.providerOptions?.anthropic?.structuredOutputMode;
      return original(options);
    };
    await runStage2(s0, stage1(packet()), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: model,
    });
    expect(mode).toBe('jsonTool');
  });

  test('retries after bad output then accepts strict valid output', async () => {
    const s0 = await stage0();
    expect(s0.kind).toBe('ok');
    if (s0.kind !== 'ok') return;

    const out = await runStage2(s0, stage1(packet()), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeSequencedNullModel([{ text: '{bad json' }, { json: validPlan() }]),
    });
    expect(out.retried).toBe(true);
    expect(out.fellBackToMinimal).toBe(false);
    expect(out.plan.sections.map((s) => s.id)).toContain('overview');
  });

  test('falls back to minimal plan after repeated invalid output', async () => {
    const s0 = await stage0();
    expect(s0.kind).toBe('ok');
    if (s0.kind !== 'ok') return;

    const out = await runStage2(s0, stage1(packet()), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeSequencedNullModel([{ text: '{bad' }, { text: '{still bad' }]),
    });
    expect(out.retried).toBe(true);
    expect(out.fellBackToMinimal).toBe(true);
    expect(out.plan.summary).toContain('falling back');
  });

  test('rejects unknown evidence packet references and retries with valid IDs', async () => {
    const s0 = await stage0();
    expect(s0.kind).toBe('ok');
    if (s0.kind !== 'ok') return;

    const bad = validPlan({
      sections: validPlan().sections.map((s) =>
        Object.assign(s, { evidencePacketIds: ['missing'] }),
      ),
    });
    const out = await runStage2(s0, stage1(packet()), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeSequencedNullModel([{ json: bad }, { json: validPlan() }]),
    });
    expect(out.retried).toBe(true);
    expect(
      out.plan.sections.flatMap((s) => s.evidencePacketIds).every((id) => id === 'pkt-a'),
    ).toBe(true);
  });

  test('schema validation rejects more than one diagram and triggers fallback', async () => {
    const s0 = await stage0();
    expect(s0.kind).toBe('ok');
    if (s0.kind !== 'ok') return;

    const tooMany = validPlan({
      diagramSpecs: [
        { id: 'd1', kind: 'mermaid-flow', mermaidSource: 'graph TD; A-->B' },
        { id: 'd2', kind: 'mermaid-flow', mermaidSource: 'graph TD; B-->C' },
      ],
    });
    const out = await runStage2(s0, stage1(packet()), deps(tooMany));
    expect(out.fellBackToMinimal).toBe(true);
    expect(out.plan.diagramSpecs).toHaveLength(0);
  });
});
