// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { KeyFilesDataSchema } from './schema.ts';

const validData = {
  title: 'Key files',
  files: [
    {
      path: 'src/index.ts',
      importance: 'entry',
      why_first: 'Starts the app.',
    },
    {
      path: 'src/pipeline.ts',
      importance: 'critical',
      why_first: 'Coordinates stages.',
    },
    {
      path: 'src/types.ts',
      importance: 'reference',
      why_first: 'Defines shared types.',
    },
  ],
};

describe('key-files schema', () => {
  test('accepts valid data', () => {
    const result = KeyFilesDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than three files', () => {
    const result = KeyFilesDataSchema.safeParse({
      title: 'Key files',
      files: [
        {
          path: 'src/index.ts',
          importance: 'entry',
          why_first: 'Starts the app.',
        },
        {
          path: 'src/pipeline.ts',
          importance: 'critical',
          why_first: 'Coordinates stages.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid importance', () => {
    const result = KeyFilesDataSchema.safeParse({
      title: 'Key files',
      files: [
        {
          path: 'src/index.ts',
          importance: 'optional',
          why_first: 'Starts the app.',
        },
        {
          path: 'src/pipeline.ts',
          importance: 'critical',
          why_first: 'Coordinates stages.',
        },
        {
          path: 'src/types.ts',
          importance: 'reference',
          why_first: 'Defines shared types.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
