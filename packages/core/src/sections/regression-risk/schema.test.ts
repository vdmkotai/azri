// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { RegressionRiskDataSchema } from './schema.ts';

const validData = {
  title: 'Regression risks',
  risks: [
    {
      severity: 'medium',
      area: 'Rendering',
      description: 'Templates could expose raw user content.',
      mitigation: 'Escape every string.',
    },
  ],
};

describe('regression-risk schema', () => {
  test('accepts valid data', () => {
    const result = RegressionRiskDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty risks array', () => {
    const result = RegressionRiskDataSchema.safeParse({
      title: 'Regression risks',
      risks: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid severity', () => {
    const result = RegressionRiskDataSchema.safeParse({
      title: 'Regression risks',
      risks: [
        {
          severity: 'info',
          area: 'Rendering',
          description: 'Templates could expose raw user content.',
          mitigation: 'Escape every string.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
