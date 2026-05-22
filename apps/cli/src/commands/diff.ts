// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { $ } from 'bun';

import {
  parseUnifiedDiff,
  readRepoSnapshot,
  runAzri,
  type ProviderName,
} from '../../../../packages/core/src/index.ts';
import {
  validateAzriConfig,
  type AzriConfig,
  type AzriRunInput,
  type AzriRunOutput,
  type ChangeSet,
  type RepoSnapshot,
} from '../../../../packages/types/src/index.ts';

import { estimateCost, formatCostEstimate } from '../cost-estimate.ts';
import { createProgress, openInBrowser } from '../ui/index.ts';

interface DiffOptions {
  base?: string;
  head: string;
  output?: string;
  open: boolean;
  verbose: boolean;
  dryRun: boolean;
  json: boolean;
  provider?: ProviderName;
  config?: string;
}

const STAGES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'collect', label: 'Collecting local diff' },
  { id: 'snapshot', label: 'Reading repo snapshot' },
  { id: 'run', label: 'Running Azri pipeline' },
  { id: 'render', label: 'Writing HTML' },
];

function parseArgs(args: string[]): DiffOptions {
  const opts: DiffOptions = {
    head: 'HEAD',
    open: false,
    verbose: false,
    dryRun: false,
    json: false,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const next = args[i + 1];
    if (arg === '--base' && next !== undefined) {
      opts.base = next;
      i += 1;
    } else if (arg === '--head' && next !== undefined) {
      opts.head = next;
      i += 1;
    } else if (arg === '--output' && next !== undefined) {
      opts.output = next;
      i += 1;
    } else if (arg === '--provider' && next !== undefined) {
      opts.provider = next as ProviderName;
      i += 1;
    } else if (arg === '--config' && next !== undefined) {
      opts.config = next;
      i += 1;
    } else if (arg === '--open') opts.open = true;
    else if (arg === '--verbose') opts.verbose = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--json') opts.json = true;
  }
  return opts;
}

async function tryGit(args: string[]): Promise<string | null> {
  try {
    const out = await $`git ${args}`.quiet().text();
    return out.trim();
  } catch {
    return null;
  }
}

async function resolveBaseRef(): Promise<string> {
  const upstream = await tryGit(['rev-parse', '--abbrev-ref', '@{u}']);
  if (upstream) return upstream;
  const originMain = await tryGit(['rev-parse', '--verify', 'origin/main']);
  if (originMain) return 'origin/main';
  return 'main';
}

async function loadConfig(configPath: string | undefined): Promise<AzriConfig> {
  const path = configPath ?? './.azri/config.json';
  try {
    const text = await readFile(path, 'utf8');
    return validateAzriConfig(JSON.parse(text));
  } catch {
    return validateAzriConfig({});
  }
}

async function readDiff(base: string, head: string): Promise<string> {
  try {
    return await $`git diff ${base}...${head}`.quiet().text();
  } catch {
    return '';
  }
}

async function buildChangeSet(base: string, head: string): Promise<ChangeSet | null> {
  const diff = await readDiff(base, head);
  if (!diff.trim()) return null;
  const files = parseUnifiedDiff(diff);
  const baseSha = (await tryGit(['rev-parse', base])) ?? base;
  const headSha = (await tryGit(['rev-parse', head])) ?? head;
  const title = (await tryGit(['log', '--format=%s', '-1', head])) ?? 'Local diff';
  return {
    baseSha,
    headSha,
    files,
    commits: [],
    prMetadata: {
      number: 0,
      title,
      body: '',
      head: { sha: headSha, repo: { id: 0 } },
      base: { sha: baseSha, repo: { id: 0 } },
      user: { type: 'User' },
    },
  };
}

function stubRepoSnapshot(): RepoSnapshot {
  return {
    owner: '',
    name: '',
    defaultBranch: '',
    readme: null,
    languages: {},
    packageManifests: {},
    fileTree: [],
    capturedAt: new Date().toISOString(),
  };
}

function resolveOutputPath(opts: DiffOptions, headSha: string): string {
  const short = headSha.slice(0, 7) || 'head';
  const path = opts.output ?? `./azri-out/diff-${short}.html`;
  return isAbsolute(path) ? path : resolve(process.cwd(), path);
}

async function writeHtml(outPath: string, html: string): Promise<void> {
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, html, 'utf8');
}

function emitDryRun(
  input: AzriRunInput,
  provider: ProviderName,
  outPath: string,
  opts: DiffOptions,
): void {
  const estimate = estimateCost(input, provider);
  if (opts.json) {
    console.log(JSON.stringify({ dryRun: true, provider, estimate, outPath }));
    return;
  }
  console.log('Dry run — no LLM call');
  console.log(formatCostEstimate(estimate));
  console.log(`Would write to: ${outPath}`);
}

async function handleSuccess(
  output: AzriRunOutput & { kind: 'ok' | 'cache-hit' },
  outPath: string,
  opts: DiffOptions,
): Promise<number> {
  await writeHtml(outPath, output.htmlBundle.html);
  const url = `file://${outPath}`;
  if (opts.json) {
    console.log(JSON.stringify({ ...output, url }));
    return 0;
  }
  console.log(`✓ Wrote diff explainer to ${outPath}`);
  console.log(`  URL: ${url}`);
  console.log(
    `  Tokens: ${output.metadata.tokensIn} in / ${output.metadata.tokensOut} out — $${output.metadata.costUsd.toFixed(4)}`,
  );
  if (opts.open) await openInBrowser(url);
  return 0;
}

function handleNonSuccess(output: AzriRunOutput, opts: DiffOptions): number {
  if (opts.json) console.log(JSON.stringify(output));
  switch (output.kind) {
    case 'too-large':
      if (!opts.json)
        console.error(`Diff too large: ${output.stats.files} files, ${output.stats.lines} lines.`);
      return 2;
    case 'head-sha-drift':
      if (!opts.json)
        console.error(`HEAD SHA drift (${output.originalHeadSha} → ${output.detectedHeadSha}).`);
      return 2;
    case 'skip':
      if (!opts.json) console.error(`Skipped: ${output.reason}.`);
      return 0;
    case 'failure':
      if (!opts.json) console.error(`Failure (${output.error.stage}): ${output.error.message}`);
      return 1;
    default:
      return 0;
  }
}

export async function runDiff(args: string[]): Promise<number> {
  const opts = parseArgs(args);
  const baseRef = opts.base ?? (await resolveBaseRef());
  const headRef = opts.head;

  const progress = createProgress({
    stages: STAGES,
    enabled: opts.verbose && !opts.json,
  });

  progress.start('collect');
  const change = await buildChangeSet(baseRef, headRef);
  if (!change) {
    progress.done();
    console.log(`No changes to explain (base=${baseRef} head=${headRef}).`);
    return 0;
  }
  progress.complete('collect');

  const provider: ProviderName = opts.provider ?? 'anthropic';
  const config = await loadConfig(opts.config);
  const outPath = resolveOutputPath(opts, change.headSha);

  if (opts.dryRun) {
    progress.done();
    emitDryRun({ mode: 'pr', repo: stubRepoSnapshot(), change, config }, provider, outPath, opts);
    return 0;
  }

  progress.start('snapshot');
  const repo = await readRepoSnapshot(process.cwd());
  progress.complete('snapshot');

  progress.start('run');
  const output = await runAzri({ mode: 'pr', repo, change, config }, { provider });
  if (output.kind === 'ok' || output.kind === 'cache-hit') {
    progress.complete('run');
    progress.start('render');
    const code = await handleSuccess(output, outPath, opts);
    progress.complete('render');
    progress.done();
    return code;
  }
  progress.fail('run', output.kind);
  progress.done();
  return handleNonSuccess(output, opts);
}
