// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { expectEscaped, XSS } from './_test-utils.ts';
import { AnnotatedDiff } from './annotated-diff.ts';

describe('AnnotatedDiff', () => {
  const schema = z.object({
    hunks: z.array(
      z.object({
        file: z.string(),
        lines: z.array(
          z.object({ kind: z.enum(['add', 'del', 'meta', 'context']), content: z.string() }),
        ),
      }),
    ),
  });

  test('escapes hunk filenames, notes, and line content', () =>
    expectEscaped(
      AnnotatedDiff({
        hunks: [{ file: XSS, lines: [{ kind: 'add', content: XSS }] }],
        annotations: [{ file: XSS, severity: 'critical', note: XSS }],
      }),
    ));
  test('props schema validates component inputs', () =>
    expect(
      schema.safeParse({ hunks: [{ file: 'a', lines: [{ kind: 'add', content: '+x' }] }] }).success,
    ).toBe(true));
  test('output snapshot', () =>
    expect(
      AnnotatedDiff({ hunks: [{ file: 'src/a.ts', lines: [{ kind: 'add', content: '+x' }] }] }),
    ).toMatchSnapshot());
});
