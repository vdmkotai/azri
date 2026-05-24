// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { ReviewerGuideDataSchema } from './schema.ts';

const validData = {
  title: 'Reviewer guide',
  priorities: [
    {
      rank: 1,
      area: 'Schemas',
      what_to_check: 'Confirm validation catches bad data.',
      files: ['src/sections/tldr/schema.ts'],
    },
    {
      rank: 2,
      area: 'Renderers',
      what_to_check: 'Confirm HTML escapes content.',
      files: ['src/sections/tldr/render.ts'],
    },
  ],
};

describe('reviewer-guide schema', () => {
  test('accepts valid data', () => {
    const result = ReviewerGuideDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than two priorities', () => {
    const result = ReviewerGuideDataSchema.safeParse({
      title: 'Reviewer guide',
      priorities: [
        {
          rank: 1,
          area: 'Schemas',
          what_to_check: 'Confirm validation catches bad data.',
          files: ['src/sections/tldr/schema.ts'],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects rank above six', () => {
    const result = ReviewerGuideDataSchema.safeParse({
      title: 'Reviewer guide',
      priorities: [
        {
          rank: 7,
          area: 'Schemas',
          what_to_check: 'Confirm validation catches bad data.',
          files: ['src/sections/tldr/schema.ts'],
        },
        {
          rank: 2,
          area: 'Renderers',
          what_to_check: 'Confirm HTML escapes content.',
          files: ['src/sections/tldr/render.ts'],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
