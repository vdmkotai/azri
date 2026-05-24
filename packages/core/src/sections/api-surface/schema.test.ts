// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { ApiSurfaceDataSchema } from './schema.ts';

const validData = {
  title: 'API surface',
  endpoints: [
    {
      method: 'GET',
      path: '/api/widgets',
      purpose: 'Lists widgets',
      auth: 'session',
    },
  ],
};

describe('api-surface schema', () => {
  test('accepts valid data', () => {
    const result = ApiSurfaceDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects unsupported HTTP method', () => {
    const result = ApiSurfaceDataSchema.safeParse({
      title: 'API surface',
      endpoints: [
        {
          method: 'TRACE',
          path: '/api/widgets',
          purpose: 'Lists widgets',
          auth: 'session',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects empty endpoints array', () => {
    const result = ApiSurfaceDataSchema.safeParse({
      title: 'API surface',
      endpoints: [],
    });
    expect(result.success).toBe(false);
  });
});
