// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors
/* eslint-disable max-lines */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { createLocalHostingAdapter } from '../../../../packages/adapters/hosting-local/src/index.ts';
import {
  fetchPrFromGitHub,
  readRepoSnapshotFromGitHub,
  runAzriV3,
  type ProviderName,
} from '../../../../packages/core/src/index.ts';
import type {
  AzriConfig,
  AzriRunOutput,
  ChangedFile,
  ChangeSet,
  HtmlBundle,
  Verbosity,
} from '../../../../packages/types/src/index.ts';
import { estimateCost, formatCostEstimate } from '../cost-estimate.ts';
import {
  applyStoredApiKey,
  buildAmbiguousProviderError,
  buildMissingKeyError,
  resolveDefaultProvider,
} from '../credentials.ts';
import {
  createGitHubClient,
  GitHubHttpError,
  listPrFiles,
  type GitHubPrFile,
} from '../github-client.ts';
import { loadAzriConfig, loadUserTokens, validateThemeName } from '../theme-loader.ts';
import {
  confirmDetailed,
  consumeVerbosityFlag,
  shouldPromptForDetailed,
  type VerbosityFlagState,
} from '../verbosity-flag.ts';

interface PrArgs {
  target: string;
  repoFlag?: string;
  output?: string;
  theme?: string;
  open: boolean;
  verbose: boolean;
  dryRun: boolean;
  json: boolean;
  provider: ProviderName;
  token?: string;
  verbosity: Verbosity | undefined;
  yes: boolean;
}

interface PrTarget {
  owner: string;
  repo: string;
  prNumber: number;
  url: string;
}

const PR_URL_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/u;
const PROVIDERS = new Set<ProviderName>(['anthropic', 'openai', 'google']);

function take(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
  return value;
}

function parseArgs(args: string[]): PrArgs {
  let providerExplicit = false;
  const parsed: PrArgs = {
    target: '',
    open: false,
    verbose: false,
    dryRun: false,
    json: false,
    provider: 'anthropic',
    verbosity: undefined,
    yes: false,
  };
  const verbState: VerbosityFlagState = { verbosity: undefined, yes: false };

  for (let i = 0; i < args.length; i++) {
    const verbHit = consumeVerbosityFlag(args, i, verbState);
    if (verbHit.consumed) {
      if (verbHit.error) throw new Error(verbHit.error);
      i += verbHit.advance;
      continue;
    }
    const arg = args[i]!;
    if (arg === '--open') parsed.open = true;
    else if (arg === '--verbose') parsed.verbose = true;
    else if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--json') parsed.json = true;
    else if (arg === '--repo') parsed.repoFlag = take(args, i++, arg);
    else if (arg === '--output') parsed.output = take(args, i++, arg);
    else if (arg === '--token') parsed.token = take(args, i++, arg);
    else if (arg === '--theme') parsed.theme = take(args, i++, arg);
    else if (arg.startsWith('--theme=')) parsed.theme = arg.slice('--theme='.length);
    else if (arg === '--provider' || arg.startsWith('--provider=')) {
      const provider =
        arg === '--provider' ? take(args, i++, arg) : arg.slice('--provider='.length);
      if (!PROVIDERS.has(provider as ProviderName))
        throw new Error(`Unknown provider: ${provider}`);
      parsed.provider = provider as ProviderName;
      providerExplicit = true;
    } else if (arg.startsWith('--')) throw new Error(`Unknown flag: ${arg}`);
    else if (parsed.target) throw new Error(`Unexpected argument: ${arg}`);
    else parsed.target = arg;
  }

  parsed.verbosity = verbState.verbosity;
  parsed.yes = verbState.yes;
  if (!providerExplicit) {
    const resolved = resolveDefaultProvider();
    if ('ambiguous' in resolved) throw new Error(buildAmbiguousProviderError(resolved.ambiguous));
    parsed.provider = 'provider' in resolved ? resolved.provider : 'anthropic';
  }
  if (!parsed.target) throw new Error('Usage: azri pr <num-or-url> [--repo owner/name]');
  return parsed;
}

function parseTarget(args: PrArgs): PrTarget {
  const urlMatch = PR_URL_RE.exec(args.target);
  if (urlMatch) {
    const [, owner, repo, num] = urlMatch;
    const prNumber = Number.parseInt(num!, 10);
    return {
      owner: owner!,
      repo: repo!,
      prNumber,
      url: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
    };
  }

  if (!/^\d+$/u.test(args.target)) throw new Error('PR target must be a number or GitHub PR URL');
  if (!args.repoFlag) throw new Error('Pass --repo <owner/name> when using a PR number');
  const repoMatch = /^([^/]+)\/([^/]+)$/u.exec(args.repoFlag);
  if (!repoMatch) throw new Error('--repo must look like owner/name');
  const [, owner, repo] = repoMatch;
  const prNumber = Number.parseInt(args.target, 10);
  return {
    owner: owner!,
    repo: repo!,
    prNumber,
    url: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
  };
}

function tokenFrom(args: PrArgs): string | undefined {
  return args.token ?? process.env['GITHUB_TOKEN'];
}

function fileStatus(status: string): ChangedFile['status'] {
  if (status === 'added' || status === 'modified' || status === 'renamed') return status;
  if (status === 'removed') return 'deleted';
  return 'modified';
}

function changeFromFiles(prNumber: number, files: GitHubPrFile[]): ChangeSet {
  return {
    baseSha: 'dry-run-base',
    headSha: 'dry-run-head',
    files: files.map((file) => ({
      path: file.filename,
      status: fileStatus(file.status),
      patch: file.patch ?? '',
      additions: file.additions,
      deletions: file.deletions,
      isBinary: !file.patch,
      isGenerated: false,
    })),
    commits: [],
    prMetadata: {
      number: prNumber,
      title: 'dry run',
      body: '',
      head: { sha: 'dry-run-head', repo: { id: 0 } },
      base: { sha: 'dry-run-base', repo: { id: 0 } },
      user: { type: 'User' },
    },
  };
}

async function saveHtml(
  outputPath: string,
  bundle: HtmlBundle,
  target: PrTarget,
  runId: string,
): Promise<string> {
  const absolute = resolve(outputPath);
  const adapter = createLocalHostingAdapter({
    baseDir: resolve(dirname(absolute), '.azri-hosting'),
  });
  await adapter.publish(bundle, {
    kind: 'pr',
    owner: target.owner,
    repo: target.repo,
    prNumber: target.prNumber,
    runId,
  });
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, bundle.html, 'utf8');
  return absolute;
}

async function openFile(path: string): Promise<void> {
  await Bun.$`open ${path}`.quiet();
}

function friendlyGitHubError(error: unknown, url: string): string | null {
  if (!(error instanceof GitHubHttpError)) return null;
  if (error.status === 404) {
    return `Error: PR not found at ${url}. If this is a private repo, note that v1 supports public repos only.`;
  }
  if (error.status === 403 && error.rateLimitRemaining === 0) {
    return 'Error: GitHub API rate limit reached. Pass --token <pat> or set GITHUB_TOKEN.';
  }
  return `Error: ${error.message}`;
}

function printRunResult(output: AzriRunOutput, outputPath: string, json: boolean): number {
  if (json)
    console.log(
      JSON.stringify({ kind: output.kind, output: outputPath, metadata: output.metadata }),
    );
  switch (output.kind) {
    case 'ok':
    case 'cache-hit':
      if (!json) console.log(`Saved PR explainer to ${outputPath}`);
      return 0;
    case 'failure':
      if (!json)
        console.error(`Error: Azri failed during ${output.error.stage}: ${output.error.message}`);
      return 1;
    case 'too-large':
      if (!json)
        console.error(
          `Error: PR too large (${output.stats.files} files, ${output.stats.lines} lines).`,
        );
      return 1;
    case 'head-sha-drift':
      if (!json)
        console.error(
          `Error: PR head changed from ${output.originalHeadSha} to ${output.detectedHeadSha}.`,
        );
      return 1;
    case 'skip':
      if (!json) console.log(`Skipped PR: ${output.reason}`);
      return 0;
  }
}

async function buildConfig(args: PrArgs): Promise<AzriConfig> {
  const repoPath = process.cwd();
  const base = await loadAzriConfig(repoPath);
  const userTokens = await loadUserTokens(repoPath);
  const themeName = args.theme ?? base.theme;
  if (themeName) validateThemeName(themeName);
  const config: AzriConfig = { ...base };
  if (args.verbosity) config.verbosity = args.verbosity;
  if (themeName) config.theme = themeName;
  if (userTokens) config.tokens = { ...base.tokens, ...userTokens };
  return config;
}

async function dryRun(args: PrArgs, target: PrTarget, token: string | undefined): Promise<number> {
  const files = await listPrFiles(target.owner, target.repo, target.prNumber, token);
  const lines = files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
  const change = changeFromFiles(target.prNumber, files);
  const repo = {
    owner: target.owner,
    name: target.repo,
    defaultBranch: '',
    readme: null,
    languages: {},
    packageManifests: {},
    fileTree: [],
    capturedAt: new Date().toISOString(),
  };
  const estimate = estimateCost(
    { mode: 'pr', repo, change, config: await buildConfig(args) },
    args.provider,
  );
  if (args.json)
    console.log(JSON.stringify({ kind: 'dry-run', files: files.length, lines, estimate }));
  else
    console.log(
      `Dry run: ${files.length} changed files, ${lines} changed lines\n\n${formatCostEstimate(estimate)}`,
    );
  return 0;
}

export async function runPr(rawArgs: string[]): Promise<number> {
  let args: PrArgs;
  let target: PrTarget;
  try {
    args = parseArgs(rawArgs);
    target = parseTarget(args);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  const token = tokenFrom(args);
  const outputPath = args.output ?? `./azri-out/pr-${target.prNumber}.html`;
  const octokit = createGitHubClient(token);

  try {
    if (args.verbose && !args.json) console.error(`Fetching ${target.url}`);
    if (args.dryRun) return await dryRun(args, target, token);
    if (!(await applyStoredApiKey(args.provider))) {
      console.error(`Error: ${buildMissingKeyError(args.provider)}`);
      return 1;
    }

    const [change, repo] = await Promise.all([
      fetchPrFromGitHub({
        owner: target.owner,
        repo: target.repo,
        prNumber: target.prNumber,
        octokit,
      }),
      readRepoSnapshotFromGitHub({ owner: target.owner, repo: target.repo, octokit }),
    ]);
    const config = await buildConfig(args);
    if (
      args.verbosity === 'detailed' &&
      shouldPromptForDetailed(args.verbosity, args.yes) &&
      !args.json
    ) {
      const est = estimateCost({ mode: 'pr', repo, change, config }, args.provider);
      const ok = await confirmDetailed(est.usd);
      if (!ok) {
        console.log('Aborted.');
        return 0;
      }
    }
    const output = await runAzriV3(
      { mode: 'pr', repo, change, config },
      { provider: args.provider },
    );
    if (output.kind === 'too-large' || output.kind === 'head-sha-drift' || output.kind === 'skip') {
      return printRunResult(output, outputPath, args.json);
    }
    const saved = await saveHtml(outputPath, output.htmlBundle, target, output.metadata.runId);
    if (args.open) await openFile(saved);
    return printRunResult(output, saved, args.json);
  } catch (error) {
    const message = friendlyGitHubError(error, target.url);
    console.error(message ?? `Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
