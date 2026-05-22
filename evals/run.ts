// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { fetchPrFromGitHub, readRepoSnapshotFromGitHub, runAzri } from '@azri/core';
import type { AzriRunInput, AzriRunOutput, SectionType } from '@azri/types';

import { makeGitHubClient } from './github-client.ts';
import { readJson, repoPath, safeTimestamp, writeJson } from './io.ts';
import type { DatasetEntry, EvalProvider, SavedRun } from './types.ts';

interface RunArgs {
  provider: EvalProvider;
  limit: number;
  dryRun: boolean;
}

const PROVIDERS = new Set(['anthropic', 'openai', 'google']);

async function main(): Promise<void> {
  const args = parseArgs(Bun.argv.slice(2));
  const dataset = await readJson<DatasetEntry[]>(repoPath('evals', 'dataset.json'));
  const selected = dataset.slice(0, Math.max(0, args.limit));
  const runRoot = repoPath('evals', 'runs', safeTimestamp(), args.provider);
  await mkdir(runRoot, { recursive: true });

  for (const entry of selected) {
    const dir = path.join(runRoot, entry.id);
    await mkdir(dir, { recursive: true });
    const saved = await runEntry(entry, args);
    await writeJson(path.join(dir, 'output.json'), saved.output);
    await writeJson(path.join(dir, 'input.json'), saved.input);
    await writeJson(path.join(dir, 'run.json'), saved);
    await writeFile(path.join(dir, 'index.html'), htmlOf(saved.output));
    console.log(`${entry.id}: ${saved.output.kind}`);
  }

  await writeJson(path.join(runRoot, 'manifest.json'), {
    provider: args.provider,
    dryRun: args.dryRun,
    limit: args.limit,
    selected: selected.map((entry) => entry.id),
  });
  console.log(`wrote ${selected.length} eval run(s) to ${runRoot}`);
}

async function runEntry(entry: DatasetEntry, args: RunArgs): Promise<SavedRun> {
  if (args.dryRun) {
    const input = stubInput(entry);
    return {
      dataset: entry,
      provider: args.provider,
      dryRun: true,
      input,
      output: stubOutput(entry),
    };
  }

  const octokit = makeGitHubClient();
  const [change, repo] = await Promise.all([
    fetchPrFromGitHub({ ...entry, octokit }),
    readRepoSnapshotFromGitHub({ ...entry, octokit }),
  ]);
  const input: AzriRunInput = { mode: 'pr', repo, change, config: {} };
  const output = await runAzri(input, { provider: args.provider });
  return { dataset: entry, provider: args.provider, dryRun: false, input, output };
}

function parseArgs(argv: string[]): RunArgs {
  const out: RunArgs = { provider: 'anthropic', limit: 3, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    if (arg === '--provider') out.provider = parseProvider(argv[++i]);
    if (arg === '--limit') out.limit = Number.parseInt(argv[++i] ?? '3', 10);
  }
  if (!Number.isFinite(out.limit) || out.limit < 0) throw new Error('--limit must be >= 0');
  return out;
}

function parseProvider(value: string | undefined): EvalProvider {
  if (value && PROVIDERS.has(value)) return value as EvalProvider;
  throw new Error('--provider must be anthropic, openai, or google');
}

function htmlOf(output: AzriRunOutput): string {
  return 'htmlBundle' in output
    ? output.htmlBundle.html
    : '<!DOCTYPE html><html><body></body></html>';
}

function stubInput(entry: DatasetEntry): AzriRunInput {
  return {
    mode: 'pr',
    repo: {
      owner: entry.owner,
      name: entry.repo,
      defaultBranch: 'main',
      readme: null,
      languages: {},
      packageManifests: {},
      fileTree: [{ path: 'src/example.ts', sizeBytes: 120, lineCount: 12 }],
      capturedAt: new Date().toISOString(),
    },
    change: {
      baseSha: '0'.repeat(40),
      headSha: '1'.repeat(40),
      files: [
        {
          path: 'src/example.ts',
          status: 'modified',
          patch: '@@ -1 +1 @@\n-export const a = 1;\n+export const a = 2;',
          additions: 1,
          deletions: 1,
          isBinary: false,
          isGenerated: false,
        },
      ],
      commits: [],
      prMetadata: {
        number: entry.prNumber,
        title: entry.note ?? entry.id,
        body: '',
        head: { sha: '1'.repeat(40), repo: { id: 1 } },
        base: { sha: '0'.repeat(40), repo: { id: 1 } },
        user: { type: 'User' },
      },
    },
    config: {},
  };
}

function stubOutput(entry: DatasetEntry): AzriRunOutput {
  return {
    kind: 'ok',
    htmlBundle: {
      html: `<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'"></head><body><main><h1>${entry.id}</h1><p>Concise technical summary cites src/example.ts:1-1.</p></main></body></html>`,
      sizeBytes: 220,
      contentHash: 'dry-run',
    },
    explainerPlan: {
      schemaVersion: 1,
      title: entry.id,
      summary: 'Concise technical summary cites src/example.ts:1-1.',
      sections: [
        section('overview'),
        section('narrative'),
        section('annotated-diff'),
        section('module-map'),
        section('risk-callouts'),
        section('test-impact'),
      ],
      collapsedFiles: [],
      diagramSpecs: [],
      risks: [
        {
          severity: 'info',
          category: 'api-contract',
          summary: 'Example risk.',
          citations: citation(),
        },
      ],
    },
    evidenceGraph: {
      packets: {
        packet1: {
          id: 'packet1',
          path: 'src/example.ts',
          symbols: [],
          summary: 'x',
          riskSignals: [],
          importance: 1,
          citations: citation(),
        },
      },
      citations: citation(),
      lookupByFile: { 'src/example.ts': ['packet1'] },
    },
    metadata: {
      runId: 'dry-run',
      engineVersion: 'dry-run',
      promptVersion: 'dry-run',
      model: 'dry-run',
      durationMs: 0,
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      cacheHit: false,
      stageDurations: {},
    },
  };
}

function section(sectionType: Exclude<SectionType, 'next-steps'>) {
  return {
    id: sectionType,
    title: sectionType,
    importance: 'important' as const,
    sectionType,
    files: ['src/example.ts'],
    proseMarkdown: 'Short readable prose.',
    evidencePacketIds: ['packet1'],
  };
}

function citation() {
  return [{ file: 'src/example.ts', lineStart: 1, lineEnd: 1, kind: 'code' as const }];
}

await main();
