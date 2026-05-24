// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { UserFlowDataSchema } from './schema.ts';

const validData = {
  title: 'User flow',
  steps: [
    {
      number: 1,
      title: 'Paste URL',
      description: 'User provides a repo URL.',
      icon: 'link',
    },
    {
      number: 2,
      title: 'Analyze',
      description: 'Azri reads source facts.',
      icon: 'search',
    },
    {
      number: 3,
      title: 'Share',
      description: 'User receives an HTML page.',
      icon: 'send',
    },
  ],
};

describe('user-flow schema', () => {
  test('accepts valid data', () => {
    const result = UserFlowDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than three steps', () => {
    const result = UserFlowDataSchema.safeParse({
      title: 'User flow',
      steps: [
        {
          number: 1,
          title: 'Paste URL',
          description: 'User provides a repo URL.',
          icon: 'link',
        },
        {
          number: 2,
          title: 'Analyze',
          description: 'Azri reads source facts.',
          icon: 'search',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects non-kebab icon name', () => {
    const result = UserFlowDataSchema.safeParse({
      title: 'User flow',
      steps: [
        {
          number: 1,
          title: 'Paste URL',
          description: 'User provides a repo URL.',
          icon: 'Bad Icon',
        },
        {
          number: 2,
          title: 'Analyze',
          description: 'Azri reads source facts.',
          icon: 'search',
        },
        {
          number: 3,
          title: 'Share',
          description: 'User receives an HTML page.',
          icon: 'send',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
