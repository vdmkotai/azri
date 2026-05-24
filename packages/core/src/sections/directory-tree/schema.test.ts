// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { DirectoryTreeDataSchema } from './schema.ts';

const validData = {
  title: 'Directory tree',
  root: 'azri',
  entries: [
    {
      path: 'src',
      kind: 'dir',
      description: 'Source code',
    },
    {
      path: 'src/index.ts',
      kind: 'file',
      description: 'Entry point',
    },
    {
      path: 'test',
      kind: 'dir',
      description: 'Tests',
    },
    {
      path: 'package.json',
      kind: 'file',
      description: 'Manifest',
    },
  ],
};

describe('directory-tree schema', () => {
  test('accepts valid data', () => {
    const result = DirectoryTreeDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than four entries', () => {
    const result = DirectoryTreeDataSchema.safeParse({
      title: 'Directory tree',
      root: 'azri',
      entries: [
        {
          path: 'src',
          kind: 'dir',
          description: 'Source code',
        },
        {
          path: 'src/index.ts',
          kind: 'file',
          description: 'Entry point',
        },
        {
          path: 'test',
          kind: 'dir',
          description: 'Tests',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid entry kind', () => {
    const result = DirectoryTreeDataSchema.safeParse({
      title: 'Directory tree',
      root: 'azri',
      entries: [
        {
          path: 'src',
          kind: 'symlink',
          description: 'Source code',
        },
        {
          path: 'src/index.ts',
          kind: 'file',
          description: 'Entry point',
        },
        {
          path: 'test',
          kind: 'dir',
          description: 'Tests',
        },
        {
          path: 'package.json',
          kind: 'file',
          description: 'Manifest',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
