// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { GettingStartedDataSchema } from './schema.ts';

const validData = {
  title: 'Getting started',
  prereqs: [
    {
      tool: 'Bun',
      version: '1.1.0',
      slug: 'bun',
    },
  ],
  steps: [
    {
      command: 'bun install',
      description: 'Install dependencies.',
    },
    {
      command: 'bun test',
      description: 'Run tests.',
    },
  ],
};

describe('getting-started schema', () => {
  test('accepts valid data', () => {
    const result = GettingStartedDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty prereqs array', () => {
    const result = GettingStartedDataSchema.safeParse({
      title: 'Getting started',
      prereqs: [],
      steps: [
        {
          command: 'bun install',
          description: 'Install dependencies.',
        },
        {
          command: 'bun test',
          description: 'Run tests.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects fewer than two steps', () => {
    const result = GettingStartedDataSchema.safeParse({
      title: 'Getting started',
      prereqs: [
        {
          tool: 'Bun',
          version: '1.1.0',
          slug: 'bun',
        },
      ],
      steps: [
        {
          command: 'bun install',
          description: 'Install dependencies.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
