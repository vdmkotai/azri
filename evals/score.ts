// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { readJson, latestProviderRun, writeJson } from './io.ts';
import { scoreAccuracy } from './scoring/accuracy.ts';
import { scoreDepth } from './scoring/depth.ts';
import { scoreNoSlop } from './scoring/no-slop.ts';
import { scoreReadability } from './scoring/readability.ts';
import { scoreVisual } from './scoring/visual.ts';
import type { EntryScores, SavedRun, ScoreReport } from './types.ts';

async function main(): Promise<void> {
  const provider = parseProvider(Bun.argv.slice(2));
  const runDir = await latestProviderRun(provider);
  if (!runDir) throw new Error('no eval run found');

  const entries: EntryScores[] = [];
  for (const name of await readdir(runDir)) {
    const dir = path.join(runDir, name);
    if (name === 'manifest.json' || name === 'scores.json') continue;
    entries.push(await scoreEntry(dir, name));
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));

  const report: ScoreReport = {
    generatedAt: new Date().toISOString(),
    runDir,
    provider: path.basename(runDir),
    entries,
    aggregate: aggregate(entries),
  };
  await writeJson(path.join(runDir, 'scores.json'), report);
  console.log(
    `wrote scores for ${entries.length} eval run(s) to ${path.join(runDir, 'scores.json')}`,
  );
}

async function scoreEntry(dir: string, id: string): Promise<EntryScores> {
  try {
    const run = await readJson<SavedRun>(path.join(dir, 'run.json'));
    const dimensions = {
      accuracy: scoreAccuracy(run),
      depth: scoreDepth(run),
      noSlop: scoreNoSlop(run),
      visual: await scoreVisual(run),
      readability: scoreReadability(run),
    };
    return {
      id: run.dataset.id,
      category: run.dataset.category,
      dimensions,
      overall: average(Object.values(dimensions).map((score) => score.score)),
    };
  } catch (error) {
    console.error(`${id}: malformed run output: ${error instanceof Error ? error.message : error}`);
    const zero = { score: 0, value: null, note: 'missing or malformed run output' };
    return {
      id,
      category: 'weird',
      dimensions: { accuracy: zero, depth: zero, noSlop: zero, visual: zero, readability: zero },
      overall: 0,
      malformed: true,
    };
  }
}

function aggregate(entries: EntryScores[]): ScoreReport['aggregate'] {
  const pick = (name: keyof EntryScores['dimensions']) =>
    average(entries.map((entry) => entry.dimensions[name].score));
  return {
    accuracy: pick('accuracy'),
    depth: pick('depth'),
    noSlop: pick('noSlop'),
    visual: pick('visual'),
    readability: pick('readability'),
    overall: average(entries.map((entry) => entry.overall)),
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function parseProvider(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--provider') return argv[i + 1];
  }
  return undefined;
}

await main();
