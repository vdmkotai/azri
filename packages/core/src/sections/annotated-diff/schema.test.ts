// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { AnnotatedDiffDataSchema } from './schema.ts';

const validData = {
  title: 'Important diff',
  hunks: [
    {
      filePath: 'src/app.ts',
      lineRange: '10-20',
      language: 'ts',
      code: 'const value = 1;',
      annotation: 'Initializes the value.',
    },
  ],
};

describe('annotated-diff schema', () => {
  test('accepts valid data', () => {
    const result = AnnotatedDiffDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty hunks array', () => {
    const result = AnnotatedDiffDataSchema.safeParse({
      title: 'Important diff',
      hunks: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects malformed line range', () => {
    const result = AnnotatedDiffDataSchema.safeParse({
      title: 'Important diff',
      hunks: [
        {
          filePath: 'src/app.ts',
          lineRange: 'bad',
          language: 'ts',
          code: 'const value = 1;',
          annotation: 'Initializes the value.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
