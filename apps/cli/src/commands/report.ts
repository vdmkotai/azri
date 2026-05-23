// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createLocalHostingAdapter } from '../../../../packages/adapters/hosting-local/src/index.ts';
import {
  metricsError,
  metricsInfo,
  metricsWarn,
  readRepoSnapshot,
  runAzri,
  setQuietMetrics,
  type OrchestratorDeps,
  type Stage0Logger,
} from '../../../../packages/core/src/index.ts';
import type {
  AzriConfig,
  AzriRunInput,
  AzriRunOutput,
  RepoSnapshot,
} from '../../../../packages/types/src/index.ts';

import { estimateCost, formatCostEstimate } from '../cost-estimate.ts';
import { detectGitContext } from '../git-context.ts';
import { loadUserTokens, validateThemeName } from '../theme-loader.ts';
import {
  createProgress,
  openInBrowser,
  type ProgressHandle,
  type ProgressStage,
} from '../ui/index.ts';
import {
  buildMissingKeyError,
  confirmDetailed,
  ensureApiKey,
  parseFlags,
  printReportHelp,
  shouldPromptForDetailed,
  type ReportFlags,
} from './report-args.ts';

const PROGRESS_STAGES: ProgressStage[] = [
  { id: 'stage-0', label: 'triage repository' },
  { id: 'stage-1', label: 'summarize files' },
  { id: 'stage-2', label: 'plan explainer' },
  { id: 'stage-3', label: 'write sections' },
  { id: 'stage-4', label: 'render HTML' },
  { id: 'stage-5', label: 'validate citations' },
];

const STAGE_STARTS: Record<string, string> = {
  'orchestrator.start': 'stage-0',
  'stage0.start': 'stage-0',
  'stage-0.start': 'stage-0',
  'stage1.start': 'stage-1',
  'stage-1.start': 'stage-1',
  'stage2.start': 'stage-2',
  'stage-2.start': 'stage-2',
  'stage3.start': 'stage-3',
  'stage-3.start': 'stage-3',
  'stage4.start': 'stage-4',
  'stage-4.start': 'stage-4',
  'stage5.start': 'stage-5',
  'stage-5.start': 'stage-5',
};

const STAGE_ENDS: Record<string, string> = {
  'stage0.end': 'stage-0',
  'stage-0.end': 'stage-0',
  'stage1.end': 'stage-1',
  'stage-1.end': 'stage-1',
  'stage2.end': 'stage-2',
  'stage-2.end': 'stage-2',
  'stage3.end': 'stage-3',
  'stage-3.end': 'stage-3',
  'stage4.end': 'stage-4',
  'stage-4.end': 'stage-4',
  'stage5.end': 'stage-5',
  'stage-5.end': 'stage-5',
};

function makeMemoryCache(): NonNullable<OrchestratorDeps['cache']> {
  const values = new Map<string, unknown>();
  return {
    async get(key) {
      return values.get(key);
    },
    async set(key, value) {
      values.set(key, value);
    },
  };
}

function makeLogger(flags: ReportFlags, progress: ProgressHandle): Stage0Logger {
  function drive(event: string, fields?: Record<string, unknown>): void {
    const started = STAGE_STARTS[event];
    const ended = STAGE_ENDS[event];
    if (started) progress.start(started);
    if (ended) progress.complete(ended);
    if (event.endsWith('.failed') || event.endsWith('.error')) {
      const stage = started ?? ended ?? 'stage-0';
      progress.fail(stage, String(fields?.['message'] ?? fields?.['errorMessage'] ?? event));
    }
  }

  return {
    info(event, fields) {
      drive(event, fields);
      if (flags.verbose) metricsInfo(event, fields);
    },
    warn(event, fields) {
      drive(event, fields);
      if (flags.verbose) metricsWarn(event, fields);
    },
    debug(event, fields) {
      drive(event, fields);
      if (flags.verbose) metricsInfo(event, fields);
    },
  };
}

async function loadConfig(flags: ReportFlags): Promise<AzriConfig> {
  const configPath = flags.configPath ?? `${flags.repoPath}/.azri/config.json`;
  const base: AzriConfig = (await Bun.file(configPath).exists())
    ? ((await Bun.file(configPath).json()) as AzriConfig)
    : {};

  const themeName = flags.theme ?? base.theme;
  if (themeName) validateThemeName(themeName);

  const userTokens = await loadUserTokens(flags.repoPath);
  const mergedTokens = userTokens ? { ...base.tokens, ...userTokens } : base.tokens;

  return {
    ...base,
    ...(themeName ? { theme: themeName } : {}),
    ...(mergedTokens ? { tokens: mergedTokens } : {}),
  };
}

async function snapshotRepo(repoPath: string): Promise<RepoSnapshot | null> {
  const gitContext = await detectGitContext(repoPath);
  if (!gitContext) return null;
  const snapshot = await readRepoSnapshot(repoPath);
  return { ...snapshot, owner: gitContext.owner, name: gitContext.repo };
}

function publicOutput(output: AzriRunOutput, savedPath: string | null): unknown {
  if (!('htmlBundle' in output)) return output;
  const htmlBundle =
    output.htmlBundle.sizeBytes > 100_000 && savedPath
      ? {
          sizeBytes: output.htmlBundle.sizeBytes,
          contentHash: output.htmlBundle.contentHash,
          path: savedPath,
        }
      : output.htmlBundle;
  return { ...output, htmlBundle, ...(savedPath ? { savedPath } : {}) };
}

async function saveRepoOutput(
  output: AzriRunOutput,
  flags: ReportFlags,
  repo: RepoSnapshot,
): Promise<string | null> {
  if (!('htmlBundle' in output)) return null;
  if (flags.outputPath === '-') {
    if (!flags.json) process.stdout.write(output.htmlBundle.html);
    return null;
  }
  const absOutput = resolve(flags.outputPath);
  await mkdir(dirname(absOutput), { recursive: true });
  const adapter = createLocalHostingAdapter({ baseDir: dirname(absOutput) });
  const result = await adapter.publish(output.htmlBundle, {
    kind: 'repo',
    owner: repo.owner,
    repo: repo.name,
    runId: output.metadata.runId,
  });
  return result.url.startsWith('file://')
    ? decodeURI(result.url.slice('file://'.length))
    : result.url;
}

function printFinal(output: AzriRunOutput, savedPath: string | null, json: boolean): number {
  if (json) {
    console.log(JSON.stringify(publicOutput(output, savedPath), null, 2));
  }

  switch (output.kind) {
    case 'ok':
    case 'cache-hit':
      if (!json && savedPath) console.log(`Saved to: ${savedPath}`);
      return 0;
    case 'too-large':
      if (!json) {
        console.error(
          `Repo too large (${output.stats.files} files / ${output.stats.lines} lines). Skipping.`,
        );
      }
      return 0;
    case 'failure':
      if (!json) console.error(output.error.message);
      return 1;
    case 'head-sha-drift':
      if (!json) console.error('Repository changed while Azri was running. Please retry.');
      return 1;
    case 'skip':
      if (!json) console.log(`Skipped: ${output.reason}`);
      return 0;
  }
}

export async function runReport(args: string[]): Promise<number> {
  const parsed = parseFlags(args);
  if ('error' in parsed) {
    console.error(`Error: ${parsed.error}`);
    return 1;
  }
  if (parsed.help) {
    printReportHelp();
    return 0;
  }

  setQuietMetrics(!parsed.verbose || parsed.json);

  try {
    const repo = await snapshotRepo(parsed.repoPath);
    if (!repo) {
      console.error(
        'Error: could not auto-detect owner/repo. Pass --repo or run inside a git repo with a remote.',
      );
      return 1;
    }

    const config = await loadConfig(parsed);
    if (parsed.verbosity) config.verbosity = parsed.verbosity;
    const input: AzriRunInput = { mode: 'repo', repo, config };

    if (parsed.dryRun) {
      const est = estimateCost(input, parsed.provider);
      console.log(parsed.json ? JSON.stringify(est, null, 2) : formatCostEstimate(est));
      return 0;
    }

    if (
      parsed.verbosity === 'detailed' &&
      shouldPromptForDetailed(parsed.verbosity, parsed.yes) &&
      !parsed.json
    ) {
      const est = estimateCost(input, parsed.provider);
      const ok = await confirmDetailed(est.usd);
      if (!ok) {
        console.log('Aborted.');
        return 0;
      }
    }

    if (!(await ensureApiKey(parsed.provider))) {
      console.error(`Error: ${buildMissingKeyError(parsed.provider)}`);
      return 1;
    }

    const progress = createProgress({
      stages: PROGRESS_STAGES,
      enabled: !parsed.json && !parsed.verbose && !process.env.CI && !!process.stdout.isTTY,
    });
    const output = await runAzri(input, {
      provider: parsed.provider,
      cache: makeMemoryCache(),
      logger: makeLogger(parsed, progress),
    });
    progress.done();

    const savedPath = await saveRepoOutput(output, parsed, repo);
    if (savedPath && parsed.open && (output.kind === 'ok' || output.kind === 'cache-hit')) {
      await openInBrowser(savedPath);
    }
    return printFinal(output, savedPath, parsed.json);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (parsed.verbose) metricsError('cli.report.failed', { errorMessage: message });
    console.error(`Error: ${message}`);
    return 1;
  }
}
