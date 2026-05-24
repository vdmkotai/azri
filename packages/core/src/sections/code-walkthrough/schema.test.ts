// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { CodeWalkthroughDataSchema } from './schema.ts';

const validData = {
  title: 'Entrypoint',
  filePath: 'src/index.ts',
  lineRange: '1-4',
  language: 'ts',
  code: 'export const value = 1;',
  annotations: [
    {
      lineOffset: 0,
      text: 'Exports the entry value.',
    },
  ],
};

describe('code-walkthrough schema', () => {
  test('accepts valid data', () => {
    const result = CodeWalkthroughDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty annotations array', () => {
    const result = CodeWalkthroughDataSchema.safeParse({
      title: 'Entrypoint',
      filePath: 'src/index.ts',
      lineRange: '1-4',
      language: 'ts',
      code: 'export const value = 1;',
      annotations: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects malformed line range', () => {
    const result = CodeWalkthroughDataSchema.safeParse({
      title: 'Entrypoint',
      filePath: 'src/index.ts',
      lineRange: '1:2',
      language: 'ts',
      code: 'export const value = 1;',
      annotations: [
        {
          lineOffset: 0,
          text: 'Exports the entry value.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
