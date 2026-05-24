// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { makeFileEntry, makeRepoInput, silentLogger } from '../../src/pipeline/_test-fixtures.ts';
import { runAzriV3 } from '../../src/pipeline/v3/orchestrator.ts';
import { makeNullModel, makeSequencedNullModel } from '../../src/providers/null-adapter.ts';
import { PROVIDER_REGISTRY, type ProviderFactory } from '../../src/providers/registry.ts';
import { listSections, registerSection, unregisterSection } from '../../src/sections/registry.ts';
import { stackGridSection } from '../../src/sections/stack-grid/index.ts';
import { tldrSection } from '../../src/sections/tldr/index.ts';
import type { SectionType } from '../../src/sections/types.ts';

const originalAnthropic = PROVIDER_REGISTRY.anthropic;
let sectionSnapshot: SectionType<unknown>[] = [];

function resetSections(sections: readonly SectionType<unknown>[]): void {
  for (const section of listSections()) unregisterSection(section.id);
  for (const section of sections) registerSection(section);
}

function evidencePacket(path: string): Record<string, unknown> {
  return {
    summary: `Important facts from ${path}`,
    symbols: ['runAzriV3'],
    riskSignals: [],
    importance: 0.8,
    citations: [{ file: path, lineStart: 1, lineEnd: 4, kind: 'code' }],
  };
}

function installMockProvider(): void {
  resetSections([tldrSection, stackGridSection]);
  const reasoningModel = makeSequencedNullModel([
    {
      json: {
        sections: [
          { id: 'tldr', rationale: 'Open with a compact summary.' },
          { id: 'stack-grid', rationale: 'Show the detected technology stack.' },
        ],
      },
    },
    {
      json: {
        hook: 'Azri turns code into explainers',
        description: 'It analyzes repository facts and renders a shareable HTML page.',
        stats: [
          { label: 'Files', value: '2' },
          { label: 'Language', value: 'TS' },
          { label: 'Mode', value: 'repo' },
        ],
      },
    },
    {
      json: {
        title: 'Stack',
        items: [
          { name: 'Bun', slug: 'bun', role: 'Runtime and test runner', category: 'Build' },
          {
            name: 'TypeScript',
            slug: 'typescript',
            role: 'Application language',
            category: 'Framework',
          },
          { name: 'Tailwind CSS', slug: 'tailwindcss', role: 'Utility styling', category: 'UI' },
        ],
      },
    },
  ]);
  const cheapModel = makeNullModel({ json: evidencePacket('src/index.ts') });

  PROVIDER_REGISTRY.anthropic = ((cfg) =>
    cfg.tier === 'cheap' ? cheapModel : reasoningModel) as ProviderFactory;
}

beforeAll(() => {
  sectionSnapshot = listSections();
  installMockProvider();
});

afterAll(() => {
  PROVIDER_REGISTRY.anthropic = originalAnthropic;
  resetSections(sectionSnapshot);
});

describe('runAzriV3 mocked LLM e2e', () => {
  test('returns ok without real provider calls', async () => {
    const output = await runAzriV3(
      makeRepoInput([
        makeFileEntry({ path: 'src/index.ts', lineCount: 20, sizeBytes: 800 }),
        makeFileEntry({ path: 'package.json', lineCount: 12, sizeBytes: 500 }),
      ]),
      {
        provider: 'anthropic',
        logger: silentLogger,
        cache: { get: async () => {}, set: async () => {} },
      },
    );

    expect(output.kind).toBe('ok');
    if (output.kind !== 'ok') throw new Error('Expected ok output');
    expect(output.plannedSections.map((section) => section.id)).toEqual(['tldr', 'stack-grid']);
    expect(output.producedSections.map((section) => section.id)).toEqual(['tldr', 'stack-grid']);
    expect(output.failedSections).toEqual([]);
    expect(output.htmlBundle.html).toContain('id="tldr"');
    expect(output.htmlBundle.html).toContain('id="stack-grid"');
    expect(output.htmlBundle.html).toContain('Azri turns code into explainers');
    expect(output.htmlBundle.html).toContain('Bun');
    expect(output.htmlBundle.html).not.toContain('<script>alert');
    expect(output.cost.tokensIn).toBeGreaterThan(0);
  });

  test('includes legacy plan entries for rendered v3 sections', async () => {
    installMockProvider();

    const output = await runAzriV3(makeRepoInput([makeFileEntry({ path: 'src/index.ts' })]), {
      provider: 'anthropic',
      logger: silentLogger,
      cache: { get: async () => {} },
    });

    expect(output.kind).toBe('ok');
    if (output.kind !== 'ok') throw new Error('Expected ok output');
    expect(output.explainerPlan.sections.map((section) => section.id)).toEqual([
      'tldr',
      'stack-grid',
    ]);
    expect(output.evidenceGraph.citations.length).toBeGreaterThan(0);
  });

  test('records stage durations and mocked token cost', async () => {
    installMockProvider();

    const output = await runAzriV3(makeRepoInput([makeFileEntry({ path: 'src/index.ts' })]), {
      provider: 'anthropic',
      logger: silentLogger,
      cache: { get: async () => {} },
    });

    expect(output.kind).toBe('ok');
    if (output.kind !== 'ok') throw new Error('Expected ok output');
    expect(Object.keys(output.metadata.stageDurations)).toEqual([
      'stage-0',
      'stage-1',
      'stage-2',
      'stage-3',
      'stage-4',
      'stage-5',
    ]);
    expect(output.cost.tokensIn).toBeGreaterThan(0);
    expect(output.cost.tokensOut).toBeGreaterThan(0);
  });

  test('writes successful bundles to the orchestrator cache', async () => {
    installMockProvider();
    const cached: unknown[] = [];

    const output = await runAzriV3(makeRepoInput([makeFileEntry({ path: 'src/index.ts' })]), {
      provider: 'anthropic',
      logger: silentLogger,
      cache: {
        get: async () => {},
        set: async (_key, value) => {
          cached.push(value);
        },
      },
    });

    expect(output.kind).toBe('ok');
    expect(cached).toHaveLength(1);
    expect(cached[0]).toMatchObject({ htmlBundle: { contentHash: expect.any(String) } });
  });

  test('returns rendered section byte counts for produced sections', async () => {
    installMockProvider();

    const output = await runAzriV3(makeRepoInput([makeFileEntry({ path: 'src/index.ts' })]), {
      provider: 'anthropic',
      logger: silentLogger,
      cache: { get: async () => {} },
    });

    expect(output.kind).toBe('ok');
    if (output.kind !== 'ok') throw new Error('Expected ok output');
    expect(output.producedSections).toHaveLength(2);
    expect(output.producedSections.every((section) => section.htmlBytes > 0)).toBe(true);
  });
});
