// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import {
  makeFile,
  makeFileEntry,
  makePrInput,
  makeRepoInput,
  stage0Deps,
} from './_test-fixtures.ts';
import { runStage0 } from './stage-0-fetch-triage.ts';
import type { Stage0Deps } from './types.ts';

describe('runStage0 — PR mode size and triage', () => {
  test('rejects oversize PR (>200 files)', async () => {
    const files = Array.from({ length: 201 }, (_, i) =>
      makeFile({ path: `src/f${i}.ts`, additions: 1, deletions: 0 }),
    );
    const out = await runStage0(makePrInput(files), stage0Deps());
    expect(out.kind).toBe('too-large');
    if (out.kind === 'too-large') {
      expect(out.stats.files).toBe(201);
    }
  });

  test('rejects oversize PR (>10K total lines)', async () => {
    const files = [makeFile({ additions: 5001, deletions: 5001 })];
    const out = await runStage0(makePrInput(files), stage0Deps());
    expect(out.kind).toBe('too-large');
  });

  test('rejects oversize PR (>500KB per file)', async () => {
    const bigPatch = '+x\n'.repeat(200000);
    const files = [makeFile({ patch: bigPatch, additions: 200000, deletions: 0 })];
    const out = await runStage0(makePrInput(files), stage0Deps());
    expect(out.kind).toBe('too-large');
    if (out.kind === 'too-large') {
      expect(out.stats.perFileMaxBytes).toBeGreaterThan(500 * 1024);
    }
  });

  test('detects bot PR author and skips', async () => {
    const input = makePrInput([makeFile()]);
    input.change!.prMetadata!.user.type = 'Bot';
    const out = await runStage0(input, stage0Deps());
    expect(out.kind).toBe('skip');
    if (out.kind === 'skip') expect(out.reason).toBe('bot-author');
  });

  test('detects fork PR (head.repo.id !== base.repo.id)', async () => {
    const input = makePrInput([makeFile()]);
    input.change!.prMetadata!.head.repo.id = 999;
    const out = await runStage0(input, stage0Deps());
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') expect(out.isFromFork).toBe(true);
  });

  test('non-fork PR has isFromFork=false', async () => {
    const out = await runStage0(makePrInput([makeFile()]), stage0Deps());
    if (out.kind === 'ok') {
      expect(out.isFromFork).toBe(false);
      expect(out.isBotAuthor).toBe(false);
    }
  });

  test('cache hit short-circuits with the cached output', async () => {
    const cached = { kind: 'ok', cached: true };
    const customDeps: Stage0Deps = {
      ...stage0Deps(),
      cache: { get: async () => cached },
    };
    const out = await runStage0(makePrInput([makeFile()]), customDeps);
    expect(out.kind).toBe('cache-hit');
    if (out.kind === 'cache-hit') expect(out.output).toEqual(cached);
  });
});

describe('runStage0 — PR mode skip reasons', () => {
  test('empty PR (0 files) → skip empty-pr', async () => {
    const out = await runStage0(makePrInput([]), stage0Deps());
    expect(out.kind).toBe('skip');
    if (out.kind === 'skip') expect(out.reason).toBe('empty-pr');
  });

  test('binary-only PR → skip binary-only', async () => {
    const out = await runStage0(
      makePrInput([
        makeFile({ path: 'a.png', isBinary: true, patch: '' }),
        makeFile({ path: 'b.png', isBinary: true, patch: '' }),
      ]),
      stage0Deps(),
    );
    expect(out.kind).toBe('skip');
    if (out.kind === 'skip') expect(out.reason).toBe('binary-only');
  });

  test('docs-only PR is classified as docs (md files survive filters)', async () => {
    const out = await runStage0(
      makePrInput([
        makeFile({ path: 'README.md', additions: 1, deletions: 0 }),
        makeFile({ path: 'docs/intro.md', additions: 2, deletions: 0 }),
      ]),
      stage0Deps(),
    );
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') expect(out.classification).toBe('docs');
  });

  test('generated-files-only PR → skip', async () => {
    const files = [
      makeFile({ path: 'package-lock.json' }),
      makeFile({ path: 'dist/bundle.min.js' }),
    ];
    const out = await runStage0(makePrInput(files), stage0Deps());
    expect(out.kind).toBe('skip');
  });

  test('skips submodule pointer changes', async () => {
    const files = [
      makeFile({ path: 'src/keep.ts' }),
      makeFile({
        path: 'vendor/submod',
        patch: '-Subproject commit abc123\n+Subproject commit def456\n',
        additions: 1,
        deletions: 1,
      }),
    ];
    const out = await runStage0(makePrInput(files), stage0Deps());
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') {
      expect(out.filteredChangedFiles.find((f) => f.path === 'vendor/submod')).toBeUndefined();
      expect(out.skippedFiles.find((s) => s.reason === 'submodule')).toBeDefined();
    }
  });
});

describe('runStage0 — PR classification', () => {
  test('classifies feature PR based on commit message', async () => {
    const input = makePrInput([makeFile()]);
    input.change!.commits[0]!.message = 'feat: add new endpoint';
    const out = await runStage0(input, stage0Deps());
    if (out.kind === 'ok') expect(out.classification).toBe('feature');
  });

  test('classifies bugfix from commit message', async () => {
    const input = makePrInput([makeFile()]);
    input.change!.commits[0]!.message = 'fix: handle null token';
    const out = await runStage0(input, stage0Deps());
    if (out.kind === 'ok') expect(out.classification).toBe('bugfix');
  });

  test('classifies migration from commit message', async () => {
    const input = makePrInput([makeFile()]);
    input.change!.commits[0]!.message = 'add new schema migration';
    const out = await runStage0(input, stage0Deps());
    if (out.kind === 'ok') expect(out.classification).toBe('migration');
  });
});

describe('runStage0 — repo mode', () => {
  test('empty fileTree → skip', async () => {
    const out = await runStage0(makeRepoInput([]), stage0Deps());
    expect(out.kind).toBe('skip');
  });

  test('repo with no README still classifies as repo-overview', async () => {
    const out = await runStage0(
      makeRepoInput([makeFileEntry({ path: 'src/a.ts' })], null),
      stage0Deps(),
    );
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') {
      expect(out.classification).toBe('repo-overview');
      expect(out.repo.readme).toBeNull();
    }
  });

  test('always-include README + package.json appear in interesting files', async () => {
    const tree = [
      makeFileEntry({ path: 'src/big.ts', sizeBytes: 50000, lastModifiedCommitsCount: 5 }),
      makeFileEntry({ path: 'README.md', sizeBytes: 50 }),
      makeFileEntry({ path: 'package.json', sizeBytes: 50 }),
      makeFileEntry({ path: 'src/index.ts', sizeBytes: 100 }),
    ];
    const out = await runStage0(makeRepoInput(tree), stage0Deps());
    if (out.kind === 'ok') {
      const paths = out.interestingFiles.map((f) => f.path);
      expect(paths).toContain('README.md');
      expect(paths).toContain('package.json');
      expect(paths).toContain('src/index.ts');
    }
  });

  test('over-cap repo tree (>100K files) → too-large', async () => {
    const tree = Array.from({ length: 100001 }, (_, i) => makeFileEntry({ path: `src/f${i}.ts` }));
    const out = await runStage0(makeRepoInput(tree), stage0Deps());
    expect(out.kind).toBe('too-large');
  });

  test('ranking excludes node_modules and dist from top picks', async () => {
    const tree = [
      makeFileEntry({ path: 'node_modules/foo/bar.js', sizeBytes: 999999 }),
      makeFileEntry({ path: 'dist/bundle.js', sizeBytes: 999999 }),
      makeFileEntry({ path: 'src/lib.ts', sizeBytes: 100 }),
    ];
    const out = await runStage0(makeRepoInput(tree), stage0Deps());
    if (out.kind === 'ok') {
      const paths = out.interestingFiles.map((f) => f.path);
      expect(paths).toContain('src/lib.ts');
      expect(paths.find((p) => p.startsWith('node_modules/'))).toBeUndefined();
      expect(paths.find((p) => p.startsWith('dist/'))).toBeUndefined();
    }
  });
});
