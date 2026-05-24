// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { DatabaseSchemaDataSchema } from './schema.ts';

const validData = {
  title: 'Database schema',
  tables: [
    {
      name: 'users',
      kind: 'sql',
      purpose: 'Stores accounts',
      fields: [
        {
          name: 'id',
          type: 'uuid',
          notes: 'Primary key',
        },
      ],
    },
  ],
};

describe('database-schema schema', () => {
  test('accepts valid data', () => {
    const result = DatabaseSchemaDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty tables array', () => {
    const result = DatabaseSchemaDataSchema.safeParse({
      title: 'Database schema',
      tables: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects unsupported database kind', () => {
    const result = DatabaseSchemaDataSchema.safeParse({
      title: 'Database schema',
      tables: [
        {
          name: 'users',
          kind: 'vector',
          purpose: 'Stores accounts',
          fields: [
            {
              name: 'id',
              type: 'uuid',
              notes: 'Primary key',
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
