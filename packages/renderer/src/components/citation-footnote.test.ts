// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { expectEscaped, XSS } from './_test-utils.ts';
import { CitationFootnote } from './citation-footnote.ts';

describe('CitationFootnote', () => {
  const schema = z.object({
    citations: z.array(
      z.object({ file: z.string(), lineStart: z.number(), lineEnd: z.number(), kind: z.string() }),
    ),
  });

  test('escapes citation labels and classes', () =>
    expectEscaped(
      CitationFootnote({ citations: [{ file: XSS, lineStart: 1, lineEnd: 2, kind: XSS }] }),
    ));
  test('props schema validates component inputs', () =>
    expect(
      schema.parse({ citations: [{ file: 'a', lineStart: 1, lineEnd: 2, kind: 'code' }] })
        .citations,
    ).toHaveLength(1));
  test('output snapshot', () =>
    expect(
      CitationFootnote({
        citations: [{ file: 'src/a.ts', lineStart: 1, lineEnd: 2, kind: 'code' }],
      }),
    ).toMatchSnapshot());
});
