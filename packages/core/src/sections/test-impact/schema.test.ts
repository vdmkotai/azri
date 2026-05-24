// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { TestImpactDataSchema } from './schema.ts';

const validData = {
  title: 'Test impact',
  added: [
    {
      testFile: 'src/sections/tldr/schema.test.ts',
      coverage: 'Schema happy path.',
    },
  ],
  changed: [
    {
      testFile: 'src/pipeline.test.ts',
      change: 'Mocks LLM calls.',
    },
  ],
  uncovered: {
    areas: ['Browser visual diff'],
    reason: 'Deferred to visual polish.',
  },
};

describe('test-impact schema', () => {
  test('accepts valid data', () => {
    const result = TestImpactDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects more than eight added entries', () => {
    const result = TestImpactDataSchema.safeParse({
      title: 'Test impact',
      added: [
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
      ],
      changed: [
        {
          testFile: 'src/pipeline.test.ts',
          change: 'Mocks LLM calls.',
        },
      ],
      uncovered: {
        areas: ['Browser visual diff'],
        reason: 'Deferred to visual polish.',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty uncovered areas', () => {
    const result = TestImpactDataSchema.safeParse({
      title: 'Test impact',
      added: [
        {
          testFile: 'src/sections/tldr/schema.test.ts',
          coverage: 'Schema happy path.',
        },
      ],
      changed: [
        {
          testFile: 'src/pipeline.test.ts',
          change: 'Mocks LLM calls.',
        },
      ],
      uncovered: {
        areas: [],
        reason: 'Deferred to visual polish.',
      },
    });
    expect(result.success).toBe(false);
  });
});
