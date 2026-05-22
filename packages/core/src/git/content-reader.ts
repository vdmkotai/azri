// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import type { RepoContentReader } from '@azri/types';

import type { OctokitLike } from './default-branch.ts';

function safeReadPath(repoPath: string, relativePath: string): string | null {
  if (!relativePath) return null;
  if (relativePath.includes('..')) return null;
  if (relativePath.startsWith('/')) return null;
  const root = resolve(repoPath);
  const resolved = resolve(join(root, relativePath));
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

async function readFileAt(repoPath: string, path: string): Promise<string | null> {
  const abs = safeReadPath(repoPath, path);
  if (!abs) return null;
  try {
    return await readFile(abs, 'utf8');
  } catch {
    return null;
  }
}

async function readLineRangeAt(
  repoPath: string,
  path: string,
  start: number,
  end: number,
): Promise<string | null> {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) return null;
  const content = await readFileAt(repoPath, path);
  if (content === null) return null;
  const lines = content.split('\n');
  return lines.slice(start - 1, end).join('\n');
}

/**
 * Create a `RepoContentReader` that reads files from a local checkout.
 * Guards against path traversal outside `repoPath`.
 */
export function createLocalRepoContentReader(repoPath: string): RepoContentReader {
  return {
    readFile: (path: string) => readFileAt(repoPath, path),
    readLineRange: (path: string, start: number, end: number) =>
      readLineRangeAt(repoPath, path, start, end),
  };
}

export interface CreateGitHubReaderOptions {
  octokit: OctokitLike;
  owner: string;
  repo: string;
  ref: string;
}

/**
 * Stub for a GitHub-backed `RepoContentReader`. The real implementation lives in T27
 * once the Octokit service is wired; for now this returns `null` from every call.
 */
export function createGitHubRepoContentReader(
  _options: CreateGitHubReaderOptions,
): RepoContentReader {
  return {
    readFile: async () => null,
    readLineRange: async () => null,
  };
}
