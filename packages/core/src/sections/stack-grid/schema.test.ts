// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { StackGridDataSchema } from './schema.ts';

const validData = {
  title: 'Stack',
  items: [
    {
      name: 'Bun',
      slug: 'bun',
      role: 'Runtime',
      category: 'Build',
    },
    {
      name: 'TypeScript',
      slug: 'typescript',
      role: 'Language',
      category: 'Framework',
    },
    {
      name: 'Tailwind',
      slug: 'tailwindcss',
      role: 'Styling',
      category: 'UI',
    },
  ],
};

describe('stack-grid schema', () => {
  test('accepts valid data', () => {
    const result = StackGridDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than three items', () => {
    const result = StackGridDataSchema.safeParse({
      title: 'Stack',
      items: [
        {
          name: 'Bun',
          slug: 'bun',
          role: 'Runtime',
          category: 'Build',
        },
        {
          name: 'TypeScript',
          slug: 'typescript',
          role: 'Language',
          category: 'Framework',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid Simple Icons slug', () => {
    const result = StackGridDataSchema.safeParse({
      title: 'Stack',
      items: [
        {
          name: 'Bun',
          slug: 'Bad Slug',
          role: 'Runtime',
          category: 'Build',
        },
        {
          name: 'TypeScript',
          slug: 'typescript',
          role: 'Language',
          category: 'Framework',
        },
        {
          name: 'Tailwind',
          slug: 'tailwindcss',
          role: 'Styling',
          category: 'UI',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
