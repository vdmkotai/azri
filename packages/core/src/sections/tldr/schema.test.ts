// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { TldrDataSchema } from './schema.ts';

const validData = {
  hook: 'Plain English overview',
  description: 'Two sentences explain the project. Three sentences add context.',
  stats: [
    {
      label: 'Files',
      value: '247',
    },
    {
      label: 'Lines',
      value: '12k',
    },
    {
      label: 'Stars',
      value: '85',
    },
  ],
};

describe('tldr schema', () => {
  test('accepts valid data', () => {
    const result = TldrDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty stats array', () => {
    const result = TldrDataSchema.safeParse({
      hook: 'Plain English overview',
      description: 'Two sentences explain the project. Three sentences add context.',
      stats: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects hook over 160 chars', () => {
    const result = TldrDataSchema.safeParse({
      hook: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      description: 'Two sentences explain the project. Three sentences add context.',
      stats: [
        {
          label: 'Files',
          value: '247',
        },
        {
          label: 'Lines',
          value: '12k',
        },
        {
          label: 'Stars',
          value: '85',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
