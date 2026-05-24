// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { ArchitectureDecisionDataSchema } from './schema.ts';

const validData = {
  title: 'Use Effect services',
  decision: 'Model side effects at service boundaries.',
  alternatives: [
    {
      option: 'Plain promises',
      why_not: 'Harder to compose retries.',
    },
  ],
  why: 'Effect keeps dependencies explicit and testable.',
  tradeoffs: {
    gain: 'Typed composition',
    cost: 'More ceremony',
  },
  citations: ['src/effect.ts'],
};

describe('architecture-decision schema', () => {
  test('accepts valid data', () => {
    const result = ArchitectureDecisionDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty alternatives array', () => {
    const result = ArchitectureDecisionDataSchema.safeParse({
      title: 'Use Effect services',
      decision: 'Model side effects at service boundaries.',
      alternatives: [],
      why: 'Effect keeps dependencies explicit and testable.',
      tradeoffs: {
        gain: 'Typed composition',
        cost: 'More ceremony',
      },
      citations: ['src/effect.ts'],
    });
    expect(result.success).toBe(false);
  });

  test('rejects overlong title', () => {
    const result = ArchitectureDecisionDataSchema.safeParse({
      title:
        'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      decision: 'Model side effects at service boundaries.',
      alternatives: [
        {
          option: 'Plain promises',
          why_not: 'Harder to compose retries.',
        },
      ],
      why: 'Effect keeps dependencies explicit and testable.',
      tradeoffs: {
        gain: 'Typed composition',
        cost: 'More ceremony',
      },
      citations: ['src/effect.ts'],
    });
    expect(result.success).toBe(false);
  });
});
