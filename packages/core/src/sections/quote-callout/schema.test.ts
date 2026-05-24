// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { QuoteCalloutDataSchema } from './schema.ts';

const validData = {
  quote: 'Tests are executable documentation.',
  attribution: {
    source: 'Azri contributors',
    url: 'https://example.com',
  },
};

describe('quote-callout schema', () => {
  test('accepts valid data', () => {
    const result = QuoteCalloutDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty quote', () => {
    const result = QuoteCalloutDataSchema.safeParse({
      quote: '',
      attribution: {
        source: 'Azri contributors',
        url: 'https://example.com',
      },
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid attribution URL', () => {
    const result = QuoteCalloutDataSchema.safeParse({
      quote: 'Tests are executable documentation.',
      attribution: {
        source: 'Azri contributors',
        url: 'not-a-url',
      },
    });
    expect(result.success).toBe(false);
  });
});
