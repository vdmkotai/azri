// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { makeFile, runFiles } from './_helpers.ts';

describe('edge: submodule changes', () => {
  test('skips submodule pointer changes with note', async () => {
    const out = await runFiles([
      makeFile({ path: 'src/real.ts' }),
      makeFile({
        path: 'vendor/lib',
        patch: '-Subproject commit abc123\n+Subproject commit def456\n',
        additions: 1,
        deletions: 1,
      }),
    ]);
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok')
      expect(out.skippedFiles).toContainEqual({ path: 'vendor/lib', reason: 'submodule' });
  });
});
