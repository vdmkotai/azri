// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors
/* eslint-disable max-lines */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { $ } from 'bun';

import {
  parseUnifiedDiff,
  readRepoSnapshot,
  runAzriV3,
  type ProviderName,
} from '../../../../packages/core/src/index.ts';
import {
  validateAzriConfig,
  type AzriConfig,
  type AzriRunInput,
  type AzriRunOutput,
  type ChangeSet,
  type RepoSnapshot,
  type Verbosity,
} from '../../../../packages/types/src/index.ts';

import { estimateCost, formatCostEstimate } from '../cost-estimate.ts';
import {
  applyStoredApiKey,
  buildAmbiguousProviderError,
  buildMissingKeyError,
  resolveDefaultProvider,
} from '../credentials.ts';
import { loadUserTokens, validateThemeName } from '../theme-loader.ts';
import { createProgress, openInBrowser } from '../ui/index.ts';
import {
  confirmDetailed,
  consumeVerbosityFlag,
  shouldPromptForDetailed,
  type VerbosityFlagState,
} from '../verbosity-flag.ts';

interface DiffOptions {
  base?: string;
  head: string;
  output?: string;
  theme?: string;
  open: boolean;
  verbose: boolean;
  dryRun: boolean;
  json: boolean;
  provider?: ProviderName;
  config?: string;
  verbosity: Verbosity | undefined;
  yes: boolean;
}

const STAGES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'collect', label: 'Collecting local diff' },
  { id: 'snapshot', label: 'Reading repo snapshot' },
  { id: 'run', label: 'Running Azri pipeline' },
  { id: 'render', label: 'Writing HTML' },
];

function parseArgs(args: string[]): DiffOptions | { error: string } {
  let providerExplicit = false;
  const opts: DiffOptions = {
    head: 'HEAD',
    open: false,
    verbose: false,
    dryRun: false,
    json: false,
    verbosity: undefined,
    yes: false,
  };
  const verbState: VerbosityFlagState = { verbosity: undefined, yes: false };
  for (let i = 0; i < args.length; i++) {
    const verbHit = consumeVerbosityFlag(args, i, verbState);
    if (verbHit.consumed) {
      if (verbHit.error) return { error: verbHit.error };
      i += verbHit.advance;
      continue;
    }
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
      providerExplicit = true;
      i += 1;
    } else if (arg.startsWith('--provider=')) {
      opts.provider = arg.slice('--provider='.length) as ProviderName;
      providerExplicit = true;
    } else if (arg === '--config' && next !== undefined) {
      opts.config = next;
      i += 1;
    } else if (arg === '--theme' && next !== undefined) {
      opts.theme = next;
      i += 1;
    } else if (arg.startsWith('--theme=')) {
      opts.theme = arg.slice('--theme='.length);
    } else if (arg === '--open') opts.open = true;
    else if (arg === '--verbose') opts.verbose = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--json') opts.json = true;
  }
  opts.verbosity = verbState.verbosity;
  opts.yes = verbState.yes;
  if (!providerExplicit) {
    const resolved = resolveDefaultProvider();
    if ('ambiguous' in resolved) return { error: buildAmbiguousProviderError(resolved.ambiguous) };
    opts.provider = 'provider' in resolved ? resolved.provider : 'anthropic';
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

async function loadConfig(
  configPath: string | undefined,
  themeOverride: string | undefined,
): Promise<AzriConfig> {
  const path = configPath ?? './.azri/config.json';
  let base: AzriConfig;
  try {
    const text = await readFile(path, 'utf8');
    base = validateAzriConfig(JSON.parse(text));
  } catch {
    base = validateAzriConfig({});
  }
  const themeName = themeOverride ?? base.theme;
  if (themeName) validateThemeName(themeName);
  const userTokens = await loadUserTokens(process.cwd());
  const mergedTokens = userTokens ? { ...base.tokens, ...userTokens } : base.tokens;
  return {
    ...base,
    ...(themeName ? { theme: themeName } : {}),
    ...(mergedTokens ? { tokens: mergedTokens } : {}),
  };
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
  const parsed = parseArgs(args);
  if ('error' in parsed) {
    console.error(`Error: ${parsed.error}`);
    return 1;
  }
  const opts = parsed;
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
  let config: AzriConfig;
  try {
    config = await loadConfig(opts.config, opts.theme);
  } catch (error) {
    progress.done();
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
  if (opts.verbosity) config.verbosity = opts.verbosity;
  const outPath = resolveOutputPath(opts, change.headSha);

  if (opts.dryRun) {
    progress.done();
    emitDryRun({ mode: 'pr', repo: stubRepoSnapshot(), change, config }, provider, outPath, opts);
    return 0;
  }

  if (
    opts.verbosity === 'detailed' &&
    shouldPromptForDetailed(opts.verbosity, opts.yes) &&
    !opts.json
  ) {
    const estimate = estimateCost(
      { mode: 'pr', repo: stubRepoSnapshot(), change, config },
      provider,
    );
    const ok = await confirmDetailed(estimate.usd);
    if (!ok) {
      progress.done();
      console.log('Aborted.');
      return 0;
    }
  }

  if (!(await applyStoredApiKey(provider))) {
    console.error(`Error: ${buildMissingKeyError(provider)}`);
    return 1;
  }

  progress.start('snapshot');
  const repo = await readRepoSnapshot(process.cwd());
  progress.complete('snapshot');

  progress.start('run');
  const output = await runAzriV3({ mode: 'pr', repo, change, config }, { provider });
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
