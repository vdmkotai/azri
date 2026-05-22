// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { makeFile, runFiles } from './_helpers.ts';

describe('edge: generated-files-only PR', () => {
  test('returns generated-only skip path', async () => {
    const out = await runFiles([makeFile({ path: 'package-lock.json' })]);
    expect(out.kind).toBe('skip');
    if (out.kind === 'skip') expect(out.reason).toBe('empty-pr');
  });
});
