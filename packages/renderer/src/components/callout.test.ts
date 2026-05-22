// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { expectEscaped, XSS } from './_test-utils.ts';
import { Callout } from './callout.ts';

describe('Callout', () => {
  const schema = z.object({
    severity: z.enum(['info', 'warn', 'critical']),
    label: z.string().optional(),
    children: z.string(),
  });

  test('escapes label content', () =>
    expectEscaped(Callout({ severity: 'warn', label: XSS, children: '<p>safe</p>' })));
  test('props schema validates component inputs', () =>
    expect(schema.safeParse({ severity: 'warn', children: '' }).success).toBe(true));
  test('output snapshot', () =>
    expect(
      Callout({ severity: 'info', label: 'Note', children: '<p>Body</p>' }),
    ).toMatchSnapshot());
});
