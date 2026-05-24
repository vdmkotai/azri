// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { RollbackPlanDataSchema } from './schema.ts';

const validData = {
  title: 'Rollback plan',
  complexity: 'simple',
  steps: [
    {
      number: 1,
      command: 'git revert HEAD',
      description: 'Revert the change.',
    },
  ],
  warnings: ['Check generated snapshots.'],
  dataMigration: {
    reversible: true,
    notes: 'No data migration.',
  },
};

describe('rollback-plan schema', () => {
  test('accepts valid data', () => {
    const result = RollbackPlanDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects invalid complexity', () => {
    const result = RollbackPlanDataSchema.safeParse({
      title: 'Rollback plan',
      complexity: 'easy',
      steps: [
        {
          number: 1,
          command: 'git revert HEAD',
          description: 'Revert the change.',
        },
      ],
      warnings: ['Check generated snapshots.'],
      dataMigration: {
        reversible: true,
        notes: 'No data migration.',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty steps array', () => {
    const result = RollbackPlanDataSchema.safeParse({
      title: 'Rollback plan',
      complexity: 'simple',
      steps: [],
      warnings: ['Check generated snapshots.'],
      dataMigration: {
        reversible: true,
        notes: 'No data migration.',
      },
    });
    expect(result.success).toBe(false);
  });
});
