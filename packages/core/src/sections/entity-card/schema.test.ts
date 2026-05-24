// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { EntityCardDataSchema } from './schema.ts';

const validData = {
  entity: {
    name: 'Planner',
    role: 'Chooses sections',
    tech: 'TypeScript',
    description: 'Turns repo facts into a narrative plan.',
    color: 'blue',
  },
  sections: [
    {
      heading: 'Why it matters',
      body: 'The planner keeps pages focused.',
    },
  ],
};

describe('entity-card schema', () => {
  test('accepts valid data', () => {
    const result = EntityCardDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty detail sections', () => {
    const result = EntityCardDataSchema.safeParse({
      entity: {
        name: 'Planner',
        role: 'Chooses sections',
        tech: 'TypeScript',
        description: 'Turns repo facts into a narrative plan.',
        color: 'blue',
      },
      sections: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid entity color', () => {
    const result = EntityCardDataSchema.safeParse({
      entity: {
        name: 'Planner',
        role: 'Chooses sections',
        tech: 'TypeScript',
        description: 'Turns repo facts into a narrative plan.',
        color: 'red',
      },
      sections: [
        {
          heading: 'Why it matters',
          body: 'The planner keeps pages focused.',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
