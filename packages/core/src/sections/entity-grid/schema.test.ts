// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { EntityGridDataSchema } from './schema.ts';

const validData = {
  title: 'Cast of characters',
  entities: [
    {
      name: 'Planner',
      role: 'Selects sections',
      tech: 'TS',
      description: 'Builds the page outline.',
      color: 'blue',
    },
    {
      name: 'Renderer',
      role: 'Outputs HTML',
      tech: 'Tailwind',
      description: 'Renders semantic section cards.',
      color: 'purple',
    },
  ],
};

describe('entity-grid schema', () => {
  test('accepts valid data', () => {
    const result = EntityGridDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than two entities', () => {
    const result = EntityGridDataSchema.safeParse({
      title: 'Cast of characters',
      entities: [
        {
          name: 'Planner',
          role: 'Selects sections',
          tech: 'TS',
          description: 'Builds the page outline.',
          color: 'blue',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid entity color', () => {
    const result = EntityGridDataSchema.safeParse({
      title: 'Cast of characters',
      entities: [
        {
          name: 'Planner',
          role: 'Selects sections',
          tech: 'TS',
          description: 'Builds the page outline.',
          color: 'red',
        },
        {
          name: 'Renderer',
          role: 'Outputs HTML',
          tech: 'Tailwind',
          description: 'Renders semantic section cards.',
          color: 'purple',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
