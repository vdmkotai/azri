// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterEach, describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { silentLogger } from '../../src/pipeline/_test-fixtures.ts';
import { runStage3Produce } from '../../src/pipeline/v3/stage-3-produce.ts';
import { makeNullModel, makeSequencedNullModel } from '../../src/providers/null-adapter.ts';
import { registerSection, unregisterSection } from '../../src/sections/registry.ts';
import type { PlannedSection, SectionInput, SectionType } from '../../src/sections/types.ts';

const registered = new Set<string>();

function section(id: string): SectionType<{ value: string }> {
  return {
    id,
    name: id,
    description: `${id} description`,
    applicableFor: ['repo', 'pr'],
    schema: z.object({ value: z.string() }),
    prompt: () => `Return ${id} JSON.`,
    render: (data) => data.value,
    cost: { tokensIn: 1, tokensOut: 1 },
  };
}

function add(id: string): void {
  registerSection(section(id));
  registered.add(id);
}

function planned(ids: readonly string[]): PlannedSection[] {
  return ids.map((id, position) => ({ id, rationale: `Why ${id}`, position }));
}

function input(): SectionInput {
  return {
    mode: 'repo',
    repo: {
      owner: 'acme',
      name: 'widgets',
      defaultBranch: 'main',
      readme: null,
      languages: { TypeScript: 1 },
      packageManifests: {},
      fileTree: [],
      capturedAt: '2026-05-23T00:00:00Z',
    },
    evidenceGraph: { packets: {}, citations: [], lookupByFile: {} },
    config: {},
  };
}

afterEach(() => {
  for (const id of registered) unregisterSection(id);
  registered.clear();
});

describe('runStage3Produce', () => {
  test('respects concurrency cap of 3 and preserves order', async () => {
    const ids = Array.from({ length: 10 }, (_, index) => `produce-${index}`);
    for (const id of ids) add(id);

    let inFlight = 0;
    let peak = 0;
    const model = makeNullModel({ json: { value: 'ok' } });
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

    const out = await runStage3Produce(planned(ids), input(), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: model,
    });

    expect(peak).toBe(3);
    expect(out.map((item) => item.id)).toEqual(ids);
  });

  test('validates section output with its schema', async () => {
    add('produce-valid');

    const out = await runStage3Produce(planned(['produce-valid']), input(), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeNullModel({ json: { value: 'valid' } }),
    });

    expect(out[0]?.data).toEqual({ value: 'valid' });
  });

  test('retries once after validation failure', async () => {
    add('produce-retry');

    const out = await runStage3Produce(planned(['produce-retry']), input(), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeSequencedNullModel([
        { json: { wrong: true } },
        { json: { value: 'fixed' } },
      ]),
    });

    expect(out).toHaveLength(1);
    expect(out[0]?.data).toEqual({ value: 'fixed' });
  });

  test('skips section after second validation failure', async () => {
    add('produce-skip');

    const out = await runStage3Produce(planned(['produce-skip']), input(), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeSequencedNullModel([
        { json: { wrong: true } },
        { json: { stillWrong: true } },
      ]),
    });

    expect(out).toEqual([]);
  });
});
