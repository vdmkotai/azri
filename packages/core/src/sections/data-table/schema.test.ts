// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { DataTableDataSchema } from './schema.ts';

const validData = {
  title: 'Metrics',
  columns: [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'value',
      label: 'Value',
      align: 'right',
    },
  ],
  rows: [
    {
      name: 'Files',
      value: 37,
    },
  ],
  caption: 'Build metrics',
};

describe('data-table schema', () => {
  test('accepts valid data', () => {
    const result = DataTableDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than two columns', () => {
    const result = DataTableDataSchema.safeParse({
      title: 'Metrics',
      columns: [
        {
          key: 'name',
          label: 'Name',
        },
      ],
      rows: [
        {
          name: 'Files',
          value: 37,
        },
      ],
      caption: 'Build metrics',
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty rows array', () => {
    const result = DataTableDataSchema.safeParse({
      title: 'Metrics',
      columns: [
        {
          key: 'name',
          label: 'Name',
        },
        {
          key: 'value',
          label: 'Value',
          align: 'right',
        },
      ],
      rows: [],
      caption: 'Build metrics',
    });
    expect(result.success).toBe(false);
  });
});
