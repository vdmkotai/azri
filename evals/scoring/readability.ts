// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { DimensionScore, SavedRun } from '../types.ts';

export function scoreReadability(run: SavedRun): DimensionScore {
  const prose = proseOf(run).replace(/<[^>]+>/gu, ' ');
  const sentences = prose
    .split(/[.!?]+/u)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = prose.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/gu) ?? [];
  if (sentences.length === 0 || words.length === 0) return { score: 1, value: 0, note: 'no prose' };

  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const readingEase =
    206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  const base = readingEase > 60 ? 5 : readingEase >= 30 ? 3 : 1;
  const penalty = words.length / sentences.length > 35 ? 1 : 0;
  return { score: Math.max(1, base - penalty), value: Number(readingEase.toFixed(2)) };
}

function proseOf(run: SavedRun): string {
  if (run.output.kind !== 'ok' && run.output.kind !== 'cache-hit')
    return JSON.stringify(run.output);
  const plan = run.output.explainerPlan;
  return [
    plan.title,
    plan.summary,
    ...plan.sections.map((section) => section.proseMarkdown ?? ''),
    ...plan.risks.map((risk) => risk.summary),
    run.output.htmlBundle.html,
  ].join('\n');
}

function countSyllables(word: string): number {
  const groups = word.replace(/(?:e|ed|es)$/u, '').match(/[aeiouy]+/gu);
  return Math.max(1, groups?.length ?? 1);
}
