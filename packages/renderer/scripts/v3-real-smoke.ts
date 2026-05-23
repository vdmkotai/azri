// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// SIDE-EFFECT IMPORT: registers all 12 sections
import * as sections from '../../core/src/sections/index.ts';

import { applyStoredApiKey } from '../../../apps/cli/src/credentials.ts';
import { readRepoSnapshot } from '../../core/src/git/read-repo.ts';
import { runAzriV3 } from '../../core/src/pipeline/v3/orchestrator.ts';
import type { AzriRunInput, AzriRunOutput } from '../../types/src/index.ts';
import { resolveV3Theme } from '../src/design-system/presets-v3/index.ts';

interface SmokeArgs {
  readonly repo: string;
  readonly output: string;
  readonly theme: string;
}

interface PlannedMetric {
  readonly id: string;
  readonly rationale?: string;
}

interface ProducedMetric {
  readonly id: string;
  readonly rationale?: string;
  readonly htmlBytes?: number;
}

interface FailedMetric {
  readonly id: string;
  readonly error: string;
}

type V3SmokeOutput = AzriRunOutput & {
  readonly plannedSections?: readonly PlannedMetric[];
  readonly producedSections?: readonly ProducedMetric[];
  readonly failedSections?: readonly FailedMetric[];
  readonly cost?: {
    readonly tokensIn?: number;
    readonly tokensOut?: number;
    readonly usd?: number;
  };
};

function parseArgs(argv: string[]): SmokeArgs {
  const args: SmokeArgs = {
    repo: '/Users/vkotai/VKProjects/artsnack-v2',
    output: '/tmp/azri-v3-artsnack.html',
    theme: 'default',
  };

  const mutable = { ...args };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!flag?.startsWith('--')) throw new Error(`unexpected argument: ${flag ?? ''}`);
    if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);

    switch (flag) {
      case '--repo':
        mutable.repo = resolve(value);
        break;
      case '--output':
        mutable.output = resolve(value);
        break;
      case '--theme':
        mutable.theme = value;
        break;
      default:
        throw new Error(`unknown argument: ${flag}`);
    }
    i++;
  }

  return mutable;
}

function printPlanned(output: V3SmokeOutput): void {
  console.log('');
  console.log('=== Sections planned ===');
  const planned = output.plannedSections;
  if (planned?.length) {
    planned.forEach((section) =>
      console.log(`  ${section.id} — ${section.rationale ?? '(no rationale)'}`),
    );
    return;
  }

  if ('explainerPlan' in output) {
    output.explainerPlan.sections.forEach((section) => console.log(`  ${section.id}`));
  }
}

function printProduced(output: V3SmokeOutput): void {
  console.log('');
  console.log('=== Sections produced ===');
  const produced = output.producedSections;
  if (produced?.length) {
    produced.forEach((section) =>
      console.log(`  ${section.id} — ${section.htmlBytes?.toLocaleString() ?? '?'} bytes`),
    );
    return;
  }

  if ('explainerPlan' in output) {
    output.explainerPlan.sections.forEach((section) =>
      console.log(
        `  ${section.id} — ${Buffer.byteLength(section.proseMarkdown ?? '', 'utf8')} data bytes`,
      ),
    );
  }
}

function printFailures(output: V3SmokeOutput): void {
  if (!output.failedSections?.length) return;
  console.log('');
  console.log('=== Sections FAILED ===');
  output.failedSections.forEach((section) => console.log(`  ${section.id} — ${section.error}`));
}

async function main(): Promise<number> {
  let args: SmokeArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  const apiKey = await applyStoredApiKey('anthropic');
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY not set. Run `azri auth login`.');
    return 1;
  }

  void sections;
  resolveV3Theme(args.theme);

  console.error('[smoke] reading repo snapshot...');
  const repo = await readRepoSnapshot(args.repo);

  console.error('[smoke] running v3 pipeline...');
  const t0 = Date.now();

  const config = { theme: args.theme, verbosity: 'standard' as const };
  const input: AzriRunInput = {
    mode: 'repo',
    repo,
    config,
  };

  let output: V3SmokeOutput;
  try {
    output = (await runAzriV3(input, { provider: 'anthropic' })) as V3SmokeOutput;
  } catch (error) {
    console.error(`[smoke] failure: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  const ms = Date.now() - t0;
  const html = 'htmlBundle' in output ? output.htmlBundle.html : undefined;
  if (html) await writeFile(args.output, html, 'utf8');

  if (output.kind !== 'ok' && output.kind !== 'cache-hit') {
    console.error(`[smoke] failure: ${output.kind}`);
    if (output.kind === 'failure')
      console.error(`[smoke] ${output.error.stage}: ${output.error.message}`);
    if (html) console.error(`[smoke] wrote partial HTML: ${args.output}`);
    return 1;
  }

  const stats = await stat(args.output);

  printPlanned(output);
  printProduced(output);
  printFailures(output);

  const tokensIn = output.cost?.tokensIn ?? output.metadata.tokensIn;
  const tokensOut = output.cost?.tokensOut ?? output.metadata.tokensOut;
  const usd = output.cost?.usd ?? output.metadata.costUsd;

  console.log('');
  console.log(`Total cost: $${usd.toFixed(4)} (${tokensIn} in / ${tokensOut} out)`);
  console.log(`Wall time: ${(ms / 1000).toFixed(1)}s`);
  console.log(`Output: ${args.output} (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log('');
  console.log('Open in browser to verify:');
  console.log(`  open ${args.output}`);

  return 0;
}

process.exit(await main());
