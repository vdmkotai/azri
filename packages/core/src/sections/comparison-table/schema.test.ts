// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { ComparisonTableDataSchema } from './schema.ts';

const validData = {
  title: 'Before and after',
  leftLabel: 'Before',
  rightLabel: 'After',
  rows: [
    {
      aspect: 'Pipeline',
      left: 'Static',
      right: 'Dynamic',
      change: 'changed',
    },
    {
      aspect: 'Tests',
      left: 'Few',
      right: 'Many',
      change: 'added',
    },
  ],
};

describe('comparison-table schema', () => {
  test('accepts valid data', () => {
    const result = ComparisonTableDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than two rows', () => {
    const result = ComparisonTableDataSchema.safeParse({
      title: 'Before and after',
      leftLabel: 'Before',
      rightLabel: 'After',
      rows: [
        {
          aspect: 'Pipeline',
          left: 'Static',
          right: 'Dynamic',
          change: 'changed',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty left label', () => {
    const result = ComparisonTableDataSchema.safeParse({
      title: 'Before and after',
      leftLabel: '',
      rightLabel: 'After',
      rows: [
        {
          aspect: 'Pipeline',
          left: 'Static',
          right: 'Dynamic',
          change: 'changed',
        },
        {
          aspect: 'Tests',
          left: 'Few',
          right: 'Many',
          change: 'added',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
