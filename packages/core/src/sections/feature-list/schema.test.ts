// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { FeatureListDataSchema } from './schema.ts';

const validData = {
  title: 'Features',
  features: [
    {
      name: 'Planning',
      description: 'Chooses useful sections.',
      status: 'shipped',
      icon: 'map',
    },
    {
      name: 'Rendering',
      description: 'Produces themed HTML.',
      status: 'beta',
      icon: 'palette',
    },
    {
      name: 'Validation',
      description: 'Checks generated data.',
      status: 'planned',
      icon: 'shield-check',
    },
  ],
};

describe('feature-list schema', () => {
  test('accepts valid data', () => {
    const result = FeatureListDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than three features', () => {
    const result = FeatureListDataSchema.safeParse({
      title: 'Features',
      features: [
        {
          name: 'Planning',
          description: 'Chooses useful sections.',
          status: 'shipped',
          icon: 'map',
        },
        {
          name: 'Rendering',
          description: 'Produces themed HTML.',
          status: 'beta',
          icon: 'palette',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects non-kebab icon name', () => {
    const result = FeatureListDataSchema.safeParse({
      title: 'Features',
      features: [
        {
          name: 'Planning',
          description: 'Chooses useful sections.',
          status: 'shipped',
          icon: 'Bad Icon',
        },
        {
          name: 'Rendering',
          description: 'Produces themed HTML.',
          status: 'beta',
          icon: 'palette',
        },
        {
          name: 'Validation',
          description: 'Checks generated data.',
          status: 'planned',
          icon: 'shield-check',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
