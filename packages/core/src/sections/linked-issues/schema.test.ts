// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { LinkedIssuesDataSchema } from './schema.ts';

const validData = {
  title: 'Linked issues',
  issues: [
    {
      number: 42,
      title: 'Cover sections',
      url: 'https://github.com/acme/widgets/issues/42',
      status: 'open',
      relation: 'closes',
    },
  ],
};

describe('linked-issues schema', () => {
  test('accepts valid data', () => {
    const result = LinkedIssuesDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty issues array', () => {
    const result = LinkedIssuesDataSchema.safeParse({
      title: 'Linked issues',
      issues: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects non-positive issue number', () => {
    const result = LinkedIssuesDataSchema.safeParse({
      title: 'Linked issues',
      issues: [
        {
          number: 0,
          title: 'Cover sections',
          url: 'https://github.com/acme/widgets/issues/42',
          status: 'open',
          relation: 'closes',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
