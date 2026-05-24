// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { WhatsNextDataSchema } from './schema.ts';

const validData = {
  title: 'What is next',
  recentCommits: [
    {
      sha: 'abcdef1',
      message: 'Add tests',
      author: 'Pat',
      date: '2026-05-24',
    },
  ],
  openPRs: [
    {
      number: 7,
      title: 'Polish visuals',
      status: 'open',
    },
  ],
  plannedWork: [
    {
      title: 'Accessibility audit',
      source: 'v0.3 plan',
    },
  ],
};

describe('whats-next schema', () => {
  test('accepts valid data', () => {
    const result = WhatsNextDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects short commit sha', () => {
    const result = WhatsNextDataSchema.safeParse({
      title: 'What is next',
      recentCommits: [
        {
          sha: 'abc',
          message: 'Add tests',
          author: 'Pat',
          date: '2026-05-24',
        },
      ],
      openPRs: [
        {
          number: 7,
          title: 'Polish visuals',
          status: 'open',
        },
      ],
      plannedWork: [
        {
          title: 'Accessibility audit',
          source: 'v0.3 plan',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects non-positive PR number', () => {
    const result = WhatsNextDataSchema.safeParse({
      title: 'What is next',
      recentCommits: [
        {
          sha: 'abcdef1',
          message: 'Add tests',
          author: 'Pat',
          date: '2026-05-24',
        },
      ],
      openPRs: [
        {
          number: 0,
          title: 'Polish visuals',
          status: 'open',
        },
      ],
      plannedWork: [
        {
          title: 'Accessibility audit',
          source: 'v0.3 plan',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
