// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { ProjectOverviewDataSchema } from './schema.ts';

const validData = {
  headline: 'Azri explains repositories',
  description: 'It turns source code into shareable HTML pages for humans.',
  personas: [
    {
      name: 'Maintainer',
      motivation: 'Review changes quickly',
    },
  ],
};

describe('project-overview schema', () => {
  test('accepts valid data', () => {
    const result = ProjectOverviewDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty personas array', () => {
    const result = ProjectOverviewDataSchema.safeParse({
      headline: 'Azri explains repositories',
      description: 'It turns source code into shareable HTML pages for humans.',
      personas: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects overlong headline', () => {
    const result = ProjectOverviewDataSchema.safeParse({
      headline:
        'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      description: 'It turns source code into shareable HTML pages for humans.',
      personas: [
        {
          name: 'Maintainer',
          motivation: 'Review changes quickly',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
