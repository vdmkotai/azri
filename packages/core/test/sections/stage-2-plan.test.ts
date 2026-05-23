// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { silentLogger } from '../../src/pipeline/_test-fixtures.ts';
import { runStage2Plan, type Stage2PlanInput } from '../../src/pipeline/v3/stage-2-plan.ts';
import { makeNullModel } from '../../src/providers/null-adapter.ts';
import { listSections, registerSection, unregisterSection } from '../../src/sections/registry.ts';
import type { SectionType } from '../../src/sections/types.ts';

const registered = new Set<string>();
let snapshot: SectionType<unknown>[] = [];

function section(
  id: string,
  modes: readonly ('pr' | 'repo')[] = ['repo', 'pr'],
): SectionType<{ value: string }> {
  return {
    id,
    name: id,
    description: `${id} description`,
    applicableFor: modes,
    schema: z.object({ value: z.string() }),
    prompt: () => 'Return JSON.',
    render: (data) => data.value,
    cost: { tokensIn: 1, tokensOut: 1 },
  };
}

function add(id: string, modes?: readonly ('pr' | 'repo')[]): void {
  registerSection(section(id, modes));
  registered.add(id);
}

function input(mode: 'pr' | 'repo' = 'repo'): Stage2PlanInput {
  return {
    mode,
    triage: {
      size: 'small',
      files: 3,
      lines: 80,
      languages: ['TypeScript'],
      tech: ['Bun'],
      recentCommits: 2,
      hasUi: false,
      hasApi: true,
      hasDb: false,
    },
  };
}

beforeAll(() => {
  snapshot = listSections();
});

beforeEach(() => {
  for (const entry of listSections()) unregisterSection(entry.id);
});

afterEach(() => {
  for (const id of registered) unregisterSection(id);
  registered.clear();
});

afterAll(() => {
  for (const entry of listSections()) unregisterSection(entry.id);
  for (const entry of snapshot) {
    registerSection(entry);
  }
});

describe('runStage2Plan', () => {
  test('accepts a valid LLM plan and preserves order', async () => {
    add('plan-a');
    add('plan-b');

    const out = await runStage2Plan(input(), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeNullModel({
        json: {
          sections: [
            { id: 'plan-a', rationale: 'First' },
            { id: 'plan-b', rationale: 'Second' },
          ],
        },
      }),
    });

    expect(out.map((item) => item.id)).toEqual(['plan-a', 'plan-b']);
    expect(out.map((item) => item.position)).toEqual([0, 1]);
  });

  test('falls back when LLM returns an invalid id', async () => {
    add('tldr');

    const out = await runStage2Plan(input(), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeNullModel({ json: { sections: [{ id: 'missing', rationale: 'Nope' }] } }),
    });

    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe('tldr');
  });

  test('enforces registered required repo sections', async () => {
    add('tldr');
    add('key-files', ['repo']);
    add('plan-c');

    const out = await runStage2Plan(input('repo'), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeNullModel({
        json: { sections: [{ id: 'plan-c', rationale: 'Useful' }] },
      }),
    });

    expect(out.map((item) => item.id)).toEqual(['tldr', 'key-files', 'plan-c']);
  });

  test('enforces registered pr-tldr first for PR plans', async () => {
    add('pr-tldr', ['pr']);
    add('plan-pr', ['pr']);

    const out = await runStage2Plan(input('pr'), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeNullModel({
        json: { sections: [{ id: 'plan-pr', rationale: 'Useful' }] },
      }),
    });

    expect(out.map((item) => item.id)).toEqual(['pr-tldr', 'plan-pr']);
  });

  test('dedupes duplicate planned sections', async () => {
    add('plan-d');

    const out = await runStage2Plan(input(), {
      logger: silentLogger,
      provider: 'anthropic',
      reasoningModel: makeNullModel({
        json: {
          sections: [
            { id: 'plan-d', rationale: 'One' },
            { id: 'plan-d', rationale: 'Two' },
          ],
        },
      }),
    });

    expect(out.map((item) => item.id)).toEqual(['plan-d']);
  });
});
