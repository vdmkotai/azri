// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { expectEscaped, XSS } from './_test-utils.ts';
import { Header } from './header.ts';

describe('Header', () => {
  const schema = z.object({
    title: z.string(),
    summary: z.string(),
    prUrl: z.string().url().optional(),
  });

  test('escapes XSS-sensitive props', () => expectEscaped(Header({ title: XSS, summary: XSS })));
  test('props schema validates component inputs', () =>
    expect(schema.parse({ title: 'T', summary: 'S' })).toEqual({ title: 'T', summary: 'S' }));
  test('output snapshot', () => expect(Header({ title: 'T', summary: 'S' })).toMatchSnapshot());
});
