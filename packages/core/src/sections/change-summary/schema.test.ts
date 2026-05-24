// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { ChangeSummaryDataSchema } from './schema.ts';

const validData = {
  title: 'Change summary',
  groups: [
    {
      module: 'Core',
      rationale: 'Adds the pipeline',
      files: [
        {
          path: 'src/core.ts',
          kind: 'modified',
          bytesChanged: 120,
        },
      ],
    },
  ],
};

describe('change-summary schema', () => {
  test('accepts valid data', () => {
    const result = ChangeSummaryDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty groups array', () => {
    const result = ChangeSummaryDataSchema.safeParse({
      title: 'Change summary',
      groups: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid file kind', () => {
    const result = ChangeSummaryDataSchema.safeParse({
      title: 'Change summary',
      groups: [
        {
          module: 'Core',
          rationale: 'Adds the pipeline',
          files: [
            {
              path: 'src/core.ts',
              kind: 'renamed',
              bytesChanged: 120,
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
