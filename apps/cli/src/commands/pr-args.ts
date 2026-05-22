// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import {
  metricsInfo,
  metricsWarn,
  type ProviderName,
  type Stage0Logger,
} from '../../../../packages/core/src/index.ts';

import type { ProgressHandle } from '../ui/index.ts';

export const PR_PROVIDERS = ['anthropic', 'openai', 'google'] as const;

export const PR_URL_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/u;

export const PR_PROGRESS_STAGES = [
  { id: 'fetch', label: 'Fetching PR from GitHub' },
  { id: 'stage-0', label: 'Triaging change' },
  { id: 'stage-1', label: 'Summarizing files' },
  { id: 'stage-2', label: 'Planning structure' },
  { id: 'stage-3', label: 'Writing sections' },
  { id: 'stage-4-5', label: 'Rendering & validating' },
  { id: 'save', label: 'Saving output' },
] as const;

const STAGE_TRANSITIONS: ReadonlyArray<readonly [string, string | null, string | null]> = [
  ['orchestrator.start', null, 'stage-0'],
  ['stage0.ok', 'stage-0', 'stage-1'],
  ['stage1.end', 'stage-1', 'stage-2'],
  ['stage2.end', 'stage-2', 'stage-3'],
  ['stage3.end', 'stage-3', 'stage-4-5'],
  ['orchestrator.end', 'stage-4-5', null],
];

export function makeProgressLogger(progress: ProgressHandle, verbose: boolean): Stage0Logger {
  const advance = (event: string): void => {
    const transition = STAGE_TRANSITIONS.find(([e]) => e === event);
    if (!transition) return;
    const [, prev, next] = transition;
    if (prev) progress.complete(prev);
    if (next) progress.start(next);
  };
  return {
    info: (event, fields) => {
      advance(event);
      if (verbose) metricsInfo(event, fields);
    },
    warn: (event, fields) => {
      if (verbose) metricsWarn(event, fields);
    },
    debug: () => {},
  };
}

export interface PrFlags {
  target: string;
  repoFlag: string | undefined;
  outputPath: string;
  configPath: string | undefined;
  open: boolean;
  verbose: boolean;
  dryRun: boolean;
  json: boolean;
  provider: ProviderName;
  token: string | undefined;
  help: boolean;
}

export interface PrTarget {
  owner: string;
  repo: string;
  prNumber: number;
}

function defaultProvider(): ProviderName {
  const env = process.env['AZRI_LLM_PROVIDER'];
  if (env && (PR_PROVIDERS as readonly string[]).includes(env)) return env as ProviderName;
  return 'anthropic';
}

export function apiKeyEnvFor(provider: ProviderName): string {
  if (provider === 'anthropic') return 'ANTHROPIC_API_KEY';
  if (provider === 'openai') return 'OPENAI_API_KEY';
  return 'GOOGLE_API_KEY';
}

export function parseFlags(args: ReadonlyArray<string>): PrFlags | { error: string } {
  const flags: PrFlags = {
    target: '',
    repoFlag: undefined,
    outputPath: '',
    configPath: undefined,
    open: false,
    verbose: false,
    dryRun: false,
    json: false,
    provider: defaultProvider(),
    token: process.env['GITHUB_TOKEN'] || undefined,
    help: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--repo') flags.repoFlag = args[++i] ?? '';
    else if (a === '--output' || a === '-o') flags.outputPath = args[++i] ?? '';
    else if (a === '--config') flags.configPath = args[++i] ?? '';
    else if (a === '--token') flags.token = args[++i] ?? undefined;
    else if (a === '--open') flags.open = true;
    else if (a === '--verbose') flags.verbose = true;
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--provider') {
      const v = args[++i] ?? '';
      if (!(PR_PROVIDERS as readonly string[]).includes(v)) {
        return { error: `invalid provider '${v}'. Choose ${PR_PROVIDERS.join(', ')}.` };
      }
      flags.provider = v as ProviderName;
    } else if (a === '--help' || a === '-h') flags.help = true;
    else if (a?.startsWith('--')) return { error: `unknown flag '${a}'` };
    else if (flags.target) return { error: `unexpected positional argument '${a}'` };
    else flags.target = a ?? '';
  }
  return flags;
}

export function resolveTarget(
  target: string,
  repoFlag: string | undefined,
): PrTarget | { error: string } {
  if (!target) return { error: 'missing <num|url> argument' };
  const urlMatch = PR_URL_RE.exec(target);
  if (urlMatch) {
    return { owner: urlMatch[1]!, repo: urlMatch[2]!, prNumber: Number(urlMatch[3]!) };
  }
  const num = Number(target);
  if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
    return {
      error: `invalid PR target '${target}'. Expected a number or https://github.com/<owner>/<repo>/pull/<n>`,
    };
  }
  if (!repoFlag) {
    return { error: `PR number '${target}' requires --repo <owner/name>` };
  }
  const parts = repoFlag.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { error: `--repo must be 'owner/name', got '${repoFlag}'` };
  }
  return { owner: parts[0], repo: parts[1], prNumber: num };
}

export function printPrHelp(): void {
  console.log(
    [
      'azri pr <num|url> — single pull request explainer (public repos only)',
      '',
      'USAGE',
      '  azri pr <num|url> [options]',
      '',
      'ARGUMENTS',
      '  <num|url>           PR number (with --repo) or full PR URL',
      '',
      'OPTIONS',
      '  --repo <owner/name> Repository when passing a bare PR number',
      '  --output <path>     Output dir hint (default: ./azri-out/pr-<num>.html)',
      "  --config <path>     AzriConfig JSON (default: cwd's .azri/config.json if present)",
      '  --provider <name>   anthropic (default) | openai | google',
      '  --token <pat>       GitHub PAT to raise rate limits (env: GITHUB_TOKEN)',
      '  --open              Open generated HTML in browser',
      '  --json              Print AzriRunOutput JSON (suppresses pretty UI)',
      '  --dry-run           Estimate cost without calling the LLM',
      '  --verbose           Show structured engine logs',
      '  -h, --help          Show this message',
      '',
      'NOTES',
      '  v1 supports public repositories only.',
    ].join('\n'),
  );
}
