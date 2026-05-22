// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { expectEscaped, XSS } from './_test-utils.ts';
import { Section } from './section.ts';

describe('Section', () => {
  const schema = z.object({ id: z.string(), title: z.string(), children: z.string() });

  test('escapes id/title while preserving trusted children HTML', () =>
    expectEscaped(Section({ id: XSS, title: XSS, children: '<p>safe</p>' })));
  test('props schema validates component inputs', () =>
    expect(schema.safeParse({ id: 'a', title: 'A', children: '' }).success).toBe(true));
  test('output snapshot', () =>
    expect(Section({ id: 'a', title: 'A', children: '<p>Body</p>' })).toMatchSnapshot());
});
