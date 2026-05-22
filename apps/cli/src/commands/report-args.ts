// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { resolve } from 'node:path';

import type { ProviderName } from '../../../../packages/core/src/index.ts';

export const PROVIDERS = ['anthropic', 'openai', 'google'] as const;

export interface ReportFlags {
  repoPath: string;
  outputPath: string;
  configPath: string | undefined;
  open: boolean;
  verbose: boolean;
  dryRun: boolean;
  json: boolean;
  provider: ProviderName;
  help: boolean;
}

export function defaultProvider(): ProviderName {
  const env = process.env['AZRI_LLM_PROVIDER'];
  if (env && (PROVIDERS as readonly string[]).includes(env)) return env as ProviderName;
  return 'anthropic';
}

export function apiKeyEnvFor(provider: ProviderName): string {
  if (provider === 'anthropic') return 'ANTHROPIC_API_KEY';
  if (provider === 'openai') return 'OPENAI_API_KEY';
  return 'GOOGLE_API_KEY';
}

export function parseFlags(args: ReadonlyArray<string>): ReportFlags | { error: string } {
  const flags: ReportFlags = {
    repoPath: process.cwd(),
    outputPath: '',
    configPath: undefined,
    open: false,
    verbose: false,
    dryRun: false,
    json: false,
    provider: defaultProvider(),
    help: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--repo') flags.repoPath = resolve(args[++i] ?? '.');
    else if (a === '--output') flags.outputPath = args[++i] ?? '';
    else if (a === '--config') flags.configPath = args[++i] ?? '';
    else if (a === '--open') flags.open = true;
    else if (a === '--verbose') flags.verbose = true;
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--json') flags.json = true;
    else if (a === '--provider') {
      const v = args[++i] ?? '';
      if (!(PROVIDERS as readonly string[]).includes(v)) {
        return { error: `invalid provider '${v}'. Choose ${PROVIDERS.join(', ')}.` };
      }
      flags.provider = v as ProviderName;
    } else if (a === '--help' || a === '-h') flags.help = true;
    else if (a?.startsWith('--')) return { error: `unknown flag '${a}'` };
    else return { error: `unexpected positional argument '${a}'` };
  }
  if (!flags.outputPath) flags.outputPath = './azri-out/repo.html';
  return flags;
}

export function printReportHelp(): void {
  console.log(
    [
      'azri report — whole-repo explainer',
      '',
      'USAGE',
      '  azri report [options]',
      '',
      'OPTIONS',
      '  --repo <path>      Repo to analyze (default: cwd)',
      "  --output <path>    Output dir hint (default: ./azri-out/repo.html). Use '-' to skip disk.",
      '  --config <path>    AzriConfig JSON (default: <repo>/.azri/config.json if present)',
      '  --provider <name>  anthropic (default) | openai | google',
      '  --open             Open generated HTML in browser',
      '  --json             Print AzriRunOutput JSON (suppresses pretty UI)',
      '  --dry-run          Estimate cost without calling the LLM',
      '  --verbose          Show structured engine logs',
      '  -h, --help         Show this message',
    ].join('\n'),
  );
}
