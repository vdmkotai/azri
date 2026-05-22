// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { runFiles } from './_helpers.ts';

describe('edge: empty PR', () => {
  test("returns kind 'skip' with empty reason", async () => {
    const out = await runFiles([]);
    expect(out.kind).toBe('skip');
    if (out.kind === 'skip') expect(out.reason).toBe('empty-pr');
  });
});
