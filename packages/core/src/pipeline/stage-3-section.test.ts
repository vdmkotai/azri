// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import type { ChangeSet, EvidenceGraph, ExplainerPlan } from '../../../types/src/index.ts';
import { ANTI_SLOP_FORBIDDEN_PHRASES } from '../prompts/index.ts';
import { makeNullModel } from '../providers/null-adapter.ts';
import { makeFile, silentLogger } from './_test-fixtures.ts';
import { runStage3 } from './stage-3-section.ts';
import type { Stage3Deps, Stage3Input } from './types.ts';

function plan(): ExplainerPlan {
  return {
    schemaVersion: 1,
    title: 'Plan',
    summary: 'Summary',
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
        id: 'risk',
        title: 'Risk',
        importance: 'important',
        sectionType: 'risk-callouts',
        files: ['src/b.ts'],
        evidencePacketIds: ['pkt-b'],
      },
    ],
    collapsedFiles: [],
    diagramSpecs: [],
    risks: [],
  };
}

function graph(): EvidenceGraph {
  return {
    packets: {
      'pkt-a': {
        id: 'pkt-a',
        path: 'src/a.ts',
        symbols: ['a'],
        summary: 'A changed.',
        riskSignals: [],
        importance: 0.8,
        citations: [{ file: 'src/a.ts', lineStart: 1, lineEnd: 2, kind: 'code' }],
      },
      'pkt-b': {
        id: 'pkt-b',
        path: 'src/b.ts',
        symbols: ['b'],
        summary: 'B changed.',
        riskSignals: ['auth'],
        importance: 0.7,
        citations: [{ file: 'src/b.ts', lineStart: 1, lineEnd: 2, kind: 'code' }],
      },
    },
    citations: [],
    lookupByFile: { 'src/a.ts': ['pkt-a'], 'src/b.ts': ['pkt-b'] },
  };
}

function input(overrides: Partial<Stage3Input> = {}): Stage3Input {
  const change: ChangeSet = {
    baseSha: 'a'.repeat(40),
    headSha: 'b'.repeat(40),
    files: [makeFile({ path: 'src/a.ts' }), makeFile({ path: 'src/b.ts' })],
    commits: [],
  };
  return {
    mode: 'pr',
    plan: plan(),
    evidenceGraph: graph(),
    repo: {
      owner: 'acme',
      name: 'widgets',
      defaultBranch: 'main',
      readme: null,
      languages: {},
      packageManifests: {},
      fileTree: [],
      capturedAt: '2026-05-22T00:00:00Z',
    },
    change,
    config: {},
    ...overrides,
  };
}

function deps(text: string): Stage3Deps {
  return { logger: silentLogger, provider: 'anthropic', reasoningModel: makeNullModel({ text }) };
}

describe('runStage3 — section generation', () => {
  test('generates sections in parallel while preserving plan order', async () => {
    let inFlight = 0;
    let peak = 0;
    const model = makeNullModel({ text: 'Paragraph with [src/a.ts:1-2].' });
    const original = model.doGenerate.bind(model);
    model.doGenerate = async (options) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5);
      });
      const result = await original(options);
      inFlight--;
      return result;
    };

    const out = await runStage3(input(), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: model,
    });
    expect(peak).toBeGreaterThan(1);
    expect(out.plan.sections.map((s) => s.id)).toEqual(['overview', 'risk']);
  });

  test('strips literal anti-slop blocklist phrases from model prose', async () => {
    const text = `${ANTI_SLOP_FORBIDDEN_PHRASES.join(' ')} Real detail [src/a.ts:1-2].`;
    const out = await runStage3(input(), deps(text));
    const prose = out.plan.sections
      .map((s) => s.proseMarkdown)
      .join('\n')
      .toLowerCase();
    for (const phrase of ANTI_SLOP_FORBIDDEN_PHRASES) {
      expect(prose).not.toContain(phrase);
    }
    expect(prose).toContain('real detail');
  });

  test('model failure is isolated to a per-section placeholder', async () => {
    const out = await runStage3(input(), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeNullModel({ throws: new Error('section failed') }),
    });
    expect(out.perSectionFailures).toBe(2);
    expect(
      out.plan.sections.every((s) => s.proseMarkdown?.includes('section generation failed')),
    ).toBe(true);
  });

  test('brief mode forwards a lower maxOutputTokens cap', async () => {
    let maxOutputTokens: unknown;
    const model = makeNullModel({ text: 'Brief [src/a.ts:1-2].' });
    const original = model.doGenerate.bind(model);
    model.doGenerate = async (options) => {
      maxOutputTokens = options.maxOutputTokens;
      return original(options);
    };

    await runStage3(input({ config: { brief: true } }), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: model,
    });
    expect(maxOutputTokens).toBe(150);
  });

  test.todo('enforces citation density >=1 citation per paragraph');
  test.todo('retries each failed section once before using placeholder');
});
