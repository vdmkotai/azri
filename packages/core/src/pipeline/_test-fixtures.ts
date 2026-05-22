// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { AzriRunInput, ChangedFile, FileEntry } from '../../../types/src/index.ts';
import type { Stage0Deps } from './types.ts';

export const silentLogger: Stage0Deps['logger'] = {
  info: () => {},
  warn: () => {},
  debug: () => {},
};

export function noCache(): Stage0Deps['cache'] {
  return {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    get: async () => {},
  };
}

export function makeFile(overrides: Partial<ChangedFile> = {}): ChangedFile {
  return {
    path: 'src/example.ts',
    status: 'modified',
    patch: '@@ -1 +1 @@\n-old\n+new\n',
    additions: 1,
    deletions: 1,
    isBinary: false,
    isGenerated: false,
    ...overrides,
  };
}

export function makeFileEntry(overrides: Partial<FileEntry> = {}): FileEntry {
  return {
    path: 'src/example.ts',
    sizeBytes: 200,
    lineCount: 10,
    lastModifiedCommitsCount: 1,
    ...overrides,
  };
}

export function makePrInput(
  files: ChangedFile[],
  overrides: Partial<AzriRunInput> = {},
): AzriRunInput {
  return {
    mode: 'pr',
    repo: {
      owner: 'acme',
      name: 'widgets',
      defaultBranch: 'main',
      readme: null,
      languages: { TypeScript: 100 },
      packageManifests: {},
      fileTree: [],
      capturedAt: '2026-05-22T00:00:00Z',
    },
    change: {
      baseSha: 'a'.repeat(40),
      headSha: 'b'.repeat(40),
      files,
      commits: [
        {
          sha: 'b'.repeat(40),
          message: 'feat: add widget',
          authorName: 'Pat',
          authoredAt: '2026-05-22T00:00:00Z',
        },
      ],
      prMetadata: {
        number: 7,
        title: 'Add widget',
        body: 'Body',
        head: { sha: 'b'.repeat(40), repo: { id: 1 } },
        base: { sha: 'a'.repeat(40), repo: { id: 1 } },
        user: { type: 'User' },
      },
    },
    config: { maxFiles: 200, maxLines: 10000 },
    ...overrides,
  };
}

export function makeRepoInput(
  fileTree: FileEntry[],
  readme: string | null = '# acme',
): AzriRunInput {
  return {
    mode: 'repo',
    repo: {
      owner: 'acme',
      name: 'widgets',
      defaultBranch: 'main',
      readme,
      languages: { TypeScript: 100 },
      packageManifests: {},
      fileTree,
      capturedAt: '2026-05-22T00:00:00Z',
    },
    config: {},
  };
}

export const stage0Deps = (): Stage0Deps => ({
  cache: noCache(),
  logger: silentLogger,
  model: 'claude-test',
});
