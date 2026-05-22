// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { readFile } from 'node:fs/promises';

import type { DimensionScore, SavedRun } from '../types.ts';

export async function scoreVisual(run: SavedRun): Promise<DimensionScore> {
  if (!(await hasVisualDeps())) {
    return {
      score: 3,
      value: null,
      note: 'TODO: Playwright + axe-core absent; WCAG2AA check skipped',
    };
  }
  if (run.output.kind !== 'ok' && run.output.kind !== 'cache-hit') {
    return { score: 1, value: 4, note: `output kind ${run.output.kind}` };
  }
  return { score: 3, value: null, note: 'TODO: wire Playwright + axe-core audit when deps exist' };
}

async function hasVisualDeps(): Promise<boolean> {
  const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return Boolean(deps['playwright'] && deps['axe-core']);
}
