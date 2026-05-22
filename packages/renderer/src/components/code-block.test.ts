// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { expectEscaped, XSS } from './_test-utils.ts';
import { CodeBlock } from './code-block.ts';

describe('CodeBlock', () => {
  const schema = z.object({ code: z.string(), language: z.string().optional() });

  test('escapes code and language values', () =>
    expectEscaped(CodeBlock({ code: XSS, language: XSS })));
  test('props schema validates component inputs', () =>
    expect(schema.parse({ code: 'x' }).code).toBe('x'));
  test('output snapshot', () =>
    expect(CodeBlock({ code: 'const x = 1;', language: 'ts' })).toMatchSnapshot());
});
