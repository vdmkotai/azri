// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { GlossaryDataSchema } from './schema.ts';

const validData = {
  title: 'Glossary',
  terms: [
    {
      term: 'Section',
      definition: 'A typed page component.',
      seeAlso: ['Registry'],
    },
    {
      term: 'Registry',
      definition: 'Catalog of sections.',
    },
    {
      term: 'Theme',
      definition: 'Tailwind token preset.',
    },
  ],
};

describe('glossary schema', () => {
  test('accepts valid data', () => {
    const result = GlossaryDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than three terms', () => {
    const result = GlossaryDataSchema.safeParse({
      title: 'Glossary',
      terms: [
        {
          term: 'Section',
          definition: 'A typed page component.',
          seeAlso: ['Registry'],
        },
        {
          term: 'Registry',
          definition: 'Catalog of sections.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects overlong term', () => {
    const result = GlossaryDataSchema.safeParse({
      title: 'Glossary',
      terms: [
        {
          term: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          definition: 'A typed page component.',
          seeAlso: ['Registry'],
        },
        {
          term: 'Registry',
          definition: 'Catalog of sections.',
        },
        {
          term: 'Theme',
          definition: 'Tailwind token preset.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
