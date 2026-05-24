// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { LinkCalloutDataSchema } from './schema.ts';

const validData = {
  url: 'https://example.com/docs',
  title: 'Read the docs',
  description: 'Reference material for the section.',
  kind: 'docs',
};

describe('link-callout schema', () => {
  test('accepts valid data', () => {
    const result = LinkCalloutDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects non-HTTPS URL', () => {
    const result = LinkCalloutDataSchema.safeParse({
      url: 'http://example.com',
      title: 'Read the docs',
      description: 'Reference material for the section.',
      kind: 'docs',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid kind', () => {
    const result = LinkCalloutDataSchema.safeParse({
      url: 'https://example.com/docs',
      title: 'Read the docs',
      description: 'Reference material for the section.',
      kind: 'blog',
    });
    expect(result.success).toBe(false);
  });
});
