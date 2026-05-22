// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { extname } from 'node:path';

import type { AzriRunInput, ChangedFile, FileEntry } from '../../../types/src/index.ts';
import { computeCacheKey } from '../cache/compute-key.ts';
import { isSubmoduleChange, shouldSkip } from '../git/file-filters.ts';

import type { PrClassification, Stage0Deps, Stage0OkOutput, Stage0Output } from './types.ts';

const MAX_FILES = 200;
const MAX_LINES = 10_000;
const MAX_FILE_BYTES = 500 * 1024;
const INTERESTING_LIMIT = 30;
const REPO_TREE_HARD_CAP = 100_000;
const COMMIT_WEIGHT = 1000;

const ENTRY_POINT_NAMES = new Set([
  'index.ts',
  'index.tsx',
  'index.js',
  'main.ts',
  'main.js',
  'main.go',
  'main.rs',
  'mod.rs',
  'app.py',
  '__main__.py',
  'main.py',
]);
const MANIFEST_NAMES = new Set([
  'package.json',
  'Cargo.toml',
  'go.mod',
  'pyproject.toml',
  'requirements.txt',
  'Gemfile',
  'pom.xml',
  'build.gradle',
]);
const README_NAMES = new Set(['README.md', 'readme.md', 'README']);

function classify(input: AzriRunInput): PrClassification {
  if (input.mode === 'repo') return 'repo-overview';
  const c = input.change;
  if (!c) return 'chore';
  const allPaths = c.files.map((f) => f.path.toLowerCase());
  const msg = c.commits.map((m) => m.message.toLowerCase()).join(' ');
  if (allPaths.length > 0 && allPaths.every((p) => p.endsWith('.md') || p.includes('docs/'))) {
    return 'docs';
  }
  if (/\bmigration\b|\bschema\b/u.test(msg)) return 'migration';
  if (/\bfix\b|\bbug\b/u.test(msg)) return 'bugfix';
  if (/\brefactor\b|\brename\b/u.test(msg)) return 'refactor';
  if (/\bchore\b|\bdeps?\b|\bupgrade\b/u.test(msg)) return 'chore';
  return 'feature';
}

function baseName(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx === -1 ? path : path.slice(idx + 1);
}

function pickInterestingFiles(tree: ReadonlyArray<FileEntry>): FileEntry[] {
  const rankedInputs = tree
    .filter((f) => !f.path.includes('node_modules/') && !f.path.includes('dist/'))
    .map((f) => ({
      f,
      score: f.sizeBytes + (f.lastModifiedCommitsCount ?? 0) * COMMIT_WEIGHT,
    }));
  // oxlint-disable-next-line unicorn/no-array-sort
  rankedInputs.sort((a, b) => b.score - a.score);
  const ranked = rankedInputs.slice(0, INTERESTING_LIMIT).map((x) => x.f);

  const must: FileEntry[] = [];
  const seen = new Set(ranked.map((f) => f.path));
  for (const f of tree) {
    const base = baseName(f.path);
    const isAlwaysInclude =
      README_NAMES.has(base) || MANIFEST_NAMES.has(base) || ENTRY_POINT_NAMES.has(base);
    if (isAlwaysInclude && !seen.has(f.path)) {
      must.push(f);
      seen.add(f.path);
    }
  }
  return [...ranked, ...must];
}

export async function runStage0(input: AzriRunInput, deps: Stage0Deps): Promise<Stage0Output> {
  const cacheKey = computeCacheKey(input, deps.model);
  deps.logger.debug('stage0.start', { mode: input.mode, cacheKey });

  const cached = await deps.cache.get(cacheKey);
  if (cached !== undefined) {
    deps.logger.info('stage0.cache.hit', { cacheKey });
    return { kind: 'cache-hit', cacheKey, output: cached };
  }

  if (input.mode === 'pr' && input.change?.prMetadata?.user.type === 'Bot') {
    deps.logger.info('stage0.skip.bot-author', { cacheKey });
    return { kind: 'skip', reason: 'bot-author', cacheKey };
  }

  if (input.mode === 'pr') {
    if (!input.change) {
      throw new Error('Stage 0: PR mode requires input.change');
    }
    const files = input.change.files;
    if (files.length === 0) {
      return { kind: 'skip', reason: 'empty-pr', cacheKey };
    }

    const totalLines = files.reduce((s, f) => s + f.additions + f.deletions, 0);
    const maxBytes = files.reduce((m, f) => Math.max(m, f.patch.length), 0);
    if (files.length > MAX_FILES || totalLines > MAX_LINES || maxBytes > MAX_FILE_BYTES) {
      deps.logger.warn('stage0.too-large', {
        files: files.length,
        lines: totalLines,
        maxBytes,
      });
      return {
        kind: 'too-large',
        stats: { files: files.length, lines: totalLines, perFileMaxBytes: maxBytes },
        cacheKey,
      };
    }

    const skippedFiles: { path: string; reason: string }[] = [];
    const kept: ChangedFile[] = [];
    for (const f of files) {
      if (isSubmoduleChange(f)) {
        skippedFiles.push({ path: f.path, reason: 'submodule' });
        continue;
      }
      if (f.isBinary) {
        skippedFiles.push({ path: f.path, reason: 'binary' });
        continue;
      }
      if (shouldSkip(f)) {
        skippedFiles.push({ path: f.path, reason: 'generated-or-excluded' });
        continue;
      }
      kept.push(f);
    }

    if (kept.length === 0) {
      const allBinary = files.every((f) => f.isBinary);
      const allDocs = files.every((f) => extname(f.path).toLowerCase() === '.md');
      const reason: 'binary-only' | 'docs-only' | 'empty-pr' = allBinary
        ? 'binary-only'
        : allDocs
          ? 'docs-only'
          : 'empty-pr';
      return { kind: 'skip', reason, cacheKey };
    }

    const md = input.change.prMetadata;
    const isFromFork = md !== undefined && md.head.repo.id !== md.base.repo.id;
    const isBotAuthor = md?.user.type === 'Bot';

    const out: Stage0OkOutput = {
      kind: 'ok',
      mode: 'pr',
      repo: input.repo,
      change: input.change,
      classification: classify(input),
      isFromFork,
      isBotAuthor,
      cacheKey,
      skippedFiles,
      interestingFiles: [],
      filteredChangedFiles: kept,
    };
    deps.logger.info('stage0.ok', {
      mode: 'pr',
      files: kept.length,
      skipped: skippedFiles.length,
      classification: out.classification,
      isFromFork,
      isBotAuthor,
    });
    return out;
  }

  if (input.repo.fileTree.length === 0) {
    return { kind: 'skip', reason: 'empty-pr', cacheKey };
  }
  if (input.repo.fileTree.length > REPO_TREE_HARD_CAP) {
    return {
      kind: 'too-large',
      stats: { files: input.repo.fileTree.length, lines: 0, perFileMaxBytes: 0 },
      cacheKey,
    };
  }
  const interesting = pickInterestingFiles(input.repo.fileTree);
  const out: Stage0OkOutput = {
    kind: 'ok',
    mode: 'repo',
    repo: input.repo,
    change: undefined,
    classification: 'repo-overview',
    isFromFork: false,
    isBotAuthor: false,
    cacheKey,
    skippedFiles: [],
    interestingFiles: interesting,
    filteredChangedFiles: [],
  };
  deps.logger.info('stage0.ok', { mode: 'repo', interestingCount: interesting.length });
  return out;
}
