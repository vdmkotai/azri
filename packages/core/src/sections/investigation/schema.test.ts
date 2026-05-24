// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { InvestigationDataSchema } from './schema.ts';

const validData = {
  title: 'Investigation',
  hypotheses: [
    {
      number: 1,
      title: 'Missing tests',
      investigation: 'Checked section folders.',
      verdict: 'confirmed',
      evidence: 'No adjacent tests existed.',
    },
    {
      number: 2,
      title: 'LLM calls leak',
      investigation: 'Reviewed mocks.',
      verdict: 'disproved',
    },
  ],
  conclusion: 'Mocks cover the full pipeline.',
};

describe('investigation schema', () => {
  test('accepts valid data', () => {
    const result = InvestigationDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than two hypotheses', () => {
    const result = InvestigationDataSchema.safeParse({
      title: 'Investigation',
      hypotheses: [
        {
          number: 1,
          title: 'Missing tests',
          investigation: 'Checked section folders.',
          verdict: 'confirmed',
          evidence: 'No adjacent tests existed.',
        },
      ],
      conclusion: 'Mocks cover the full pipeline.',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid verdict', () => {
    const result = InvestigationDataSchema.safeParse({
      title: 'Investigation',
      hypotheses: [
        {
          number: 1,
          title: 'Missing tests',
          investigation: 'Checked section folders.',
          verdict: 'maybe',
          evidence: 'No adjacent tests existed.',
        },
        {
          number: 2,
          title: 'LLM calls leak',
          investigation: 'Reviewed mocks.',
          verdict: 'disproved',
        },
      ],
      conclusion: 'Mocks cover the full pipeline.',
    });
    expect(result.success).toBe(false);
  });
});
