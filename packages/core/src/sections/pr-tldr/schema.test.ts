// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { PrTldrDataSchema } from './schema.ts';

const validData = {
  what: 'Adds section tests',
  why: 'The new pipeline needs per-section coverage.',
  impact: 'internal',
  stats: {
    filesChanged: 75,
    additions: 1200,
    deletions: 0,
  },
};

describe('pr-tldr schema', () => {
  test('accepts valid data', () => {
    const result = PrTldrDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects invalid impact', () => {
    const result = PrTldrDataSchema.safeParse({
      what: 'Adds section tests',
      why: 'The new pipeline needs per-section coverage.',
      impact: 'huge',
      stats: {
        filesChanged: 75,
        additions: 1200,
        deletions: 0,
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects negative additions', () => {
    const result = PrTldrDataSchema.safeParse({
      what: 'Adds section tests',
      why: 'The new pipeline needs per-section coverage.',
      impact: 'internal',
      stats: {
        filesChanged: 75,
        additions: -1,
        deletions: 0,
      },
    });
    expect(result.success).toBe(false);
  });
});
