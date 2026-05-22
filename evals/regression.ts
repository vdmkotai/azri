// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import path from 'node:path';

import { latestProviderRun, readJson } from './io.ts';
import type { ScoreReport } from './types.ts';

interface Baseline {
  aggregate: { overall: number };
}

async function main(): Promise<void> {
  const provider = parseProvider(Bun.argv.slice(2));
  const runDir = await latestProviderRun(provider);
  if (!runDir) throw new Error('no eval run found');

  const latest = await readJson<ScoreReport>(path.join(runDir, 'scores.json'));
  const baseline = await readJson<Baseline>(path.join(process.cwd(), 'evals', 'baseline.json'));
  const baselineAvg = baseline.aggregate.overall;
  const latestAvg = latest.aggregate.overall;
  const drop = baselineAvg === 0 ? 0 : (baselineAvg - latestAvg) / baselineAvg;

  console.log(
    `baseline=${baselineAvg.toFixed(3)} latest=${latestAvg.toFixed(3)} drop=${(drop * 100).toFixed(2)}%`,
  );
  if (drop > 0.05) {
    console.error('regression check failed: average score dropped by more than 5%');
    process.exit(1);
  }
  console.log('regression check passed');
}

function parseProvider(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--provider') return argv[i + 1];
  }
  return undefined;
}

await main();
