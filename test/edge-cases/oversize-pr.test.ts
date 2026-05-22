// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { makeFile, runFiles } from './_helpers.ts';

describe('edge: oversize PR', () => {
  test("returns kind 'too-large'", async () => {
    const out = await runFiles(
      Array.from({ length: 201 }, (_, i) => makeFile({ path: `src/${i}.ts` })),
    );
    expect(out.kind).toBe('too-large');
  });
});
