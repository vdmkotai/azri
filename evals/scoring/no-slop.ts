// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { DimensionScore, SavedRun } from '../types.ts';

const FORBIDDEN = [
  'robust',
  'seamless',
  'leverage',
  'utilize',
  'this PR introduces',
  "let's dive into",
  'moreover',
  'furthermore',
];

export function scoreNoSlop(run: SavedRun): DimensionScore {
  const text = outputText(run).toLowerCase();
  const hits = FORBIDDEN.reduce((sum, phrase) => sum + countLiteral(text, phrase.toLowerCase()), 0);
  return { score: 5 - Math.min(4, hits), value: hits };
}

function outputText(run: SavedRun): string {
  if (run.output.kind === 'ok' || run.output.kind === 'cache-hit') {
    return [run.output.htmlBundle.html, JSON.stringify(run.output.explainerPlan)].join('\n');
  }
  if (run.output.kind === 'failure') return run.output.htmlBundle.html;
  return JSON.stringify(run.output);
}

function countLiteral(text: string, needle: string): number {
  let count = 0;
  let index = text.indexOf(needle);
  while (index >= 0) {
    count++;
    index = text.indexOf(needle, index + needle.length);
  }
  return count;
}
