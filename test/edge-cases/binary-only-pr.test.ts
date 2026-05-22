// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { makeFile, runFiles } from './_helpers.ts';

describe('edge: binary-only PR', () => {
  test('returns metadata-only skip reason', async () => {
    const out = await runFiles([makeFile({ path: 'asset.png', isBinary: true, patch: '' })]);
    expect(out.kind).toBe('skip');
    if (out.kind === 'skip') expect(out.reason).toBe('binary-only');
  });
});
