// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { MigrationNotesDataSchema } from './schema.ts';

const validData = {
  title: 'Migration notes',
  isBreaking: true,
  breakingChanges: [
    {
      what: 'Config changed',
      before: 'oldConfig()',
      after: 'newConfig()',
      migrationSteps: ['Rename the field.'],
    },
  ],
  deprecations: [
    {
      what: 'Old option',
      replacement: 'New option',
      removalETA: 'v1',
    },
  ],
};

describe('migration-notes schema', () => {
  test('accepts valid data', () => {
    const result = MigrationNotesDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects missing migration steps', () => {
    const result = MigrationNotesDataSchema.safeParse({
      title: 'Migration notes',
      isBreaking: true,
      breakingChanges: [
        {
          what: 'Config changed',
          before: 'oldConfig()',
          after: 'newConfig()',
          migrationSteps: [],
        },
      ],
      deprecations: [
        {
          what: 'Old option',
          replacement: 'New option',
          removalETA: 'v1',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects overlong title', () => {
    const result = MigrationNotesDataSchema.safeParse({
      title:
        'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      isBreaking: true,
      breakingChanges: [
        {
          what: 'Config changed',
          before: 'oldConfig()',
          after: 'newConfig()',
          migrationSteps: ['Rename the field.'],
        },
      ],
      deprecations: [
        {
          what: 'Old option',
          replacement: 'New option',
          removalETA: 'v1',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
