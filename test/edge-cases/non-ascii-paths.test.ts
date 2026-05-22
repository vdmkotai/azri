// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { makeFile, runFiles } from './_helpers.ts';

describe('edge: non-ASCII paths', () => {
  test('preserves CJK and emoji paths in Stage 0 output', async () => {
    const path = 'src/変更-✨.ts';
    const out = await runFiles([makeFile({ path })]);
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') expect(out.filteredChangedFiles[0]?.path).toBe(path);
  });
});
