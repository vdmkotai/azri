// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { RiskCalloutDataSchema } from './schema.ts';

const validData = {
  severity: 'warn',
  title: 'Watch escaping',
  body: 'User content must never render as executable HTML.',
  suggestion: 'Assert escaped output.',
};

describe('risk-callout schema', () => {
  test('accepts valid data', () => {
    const result = RiskCalloutDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects invalid severity', () => {
    const result = RiskCalloutDataSchema.safeParse({
      severity: 'critical',
      title: 'Watch escaping',
      body: 'User content must never render as executable HTML.',
      suggestion: 'Assert escaped output.',
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty body', () => {
    const result = RiskCalloutDataSchema.safeParse({
      severity: 'warn',
      title: 'Watch escaping',
      body: '',
      suggestion: 'Assert escaped output.',
    });
    expect(result.success).toBe(false);
  });
});
