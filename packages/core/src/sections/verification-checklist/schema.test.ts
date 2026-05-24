// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { VerificationChecklistDataSchema } from './schema.ts';

const validData = {
  title: 'Verification checklist',
  items: [
    {
      description: 'Schemas validate data.',
      verified: true,
      method: 'bun test',
    },
    {
      description: 'No real LLM calls.',
      verified: true,
      method: 'mock model',
    },
  ],
};

describe('verification-checklist schema', () => {
  test('accepts valid data', () => {
    const result = VerificationChecklistDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than two items', () => {
    const result = VerificationChecklistDataSchema.safeParse({
      title: 'Verification checklist',
      items: [
        {
          description: 'Schemas validate data.',
          verified: true,
          method: 'bun test',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects non-boolean verified flag', () => {
    const result = VerificationChecklistDataSchema.safeParse({
      title: 'Verification checklist',
      items: [
        {
          description: 'Schemas validate data.',
          verified: 'yes',
          method: 'bun test',
        },
        {
          description: 'No real LLM calls.',
          verified: true,
          method: 'mock model',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
