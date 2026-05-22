// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { $ } from 'bun';

import type { ChangeSet, Commit } from '@azri/types';

import { parseUnifiedDiff } from './parse-diff.ts';

export interface FetchPrLocallyOptions {
  repoPath: string;
  prNumber: number;
  token?: string;
}

interface GhPrView {
  baseRefName: string;
  headRefName: string;
  headRefOid: string;
  baseRefOid: string;
  number: number;
  title: string;
  body: string;
  author?: { login: string; is_bot?: boolean } | null;
  headRepository?: { id?: string | null } | null;
  baseRepository?: { id?: string | null } | null;
}

async function ghJson<T>(args: string[], token?: string): Promise<T> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  if (token) env['GH_TOKEN'] = token;
  const result = await $`gh ${args}`.env(env).quiet().text();
  return JSON.parse(result) as T;
}

async function readCommits(repoPath: string, baseSha: string, headSha: string): Promise<Commit[]> {
  try {
    const out =
      await $`git -C ${repoPath} log --format=%H%x00%s%x00%an%x00%aI ${baseSha}..${headSha}`
        .quiet()
        .text();
    const commits: Commit[] = [];
    for (const line of out.split('\n')) {
      const [sha, message, authorName, authoredAt] = line.split('\0');
      if (!sha) continue;
      commits.push({
        sha,
        message: message ?? '',
        authorName: authorName ?? '',
        authoredAt: authoredAt ?? '',
      });
    }
    return commits;
  } catch {
    return [];
  }
}

/**
 * Fetch a pull request's diff and metadata using the local `gh` CLI.
 * Requires `gh` to be installed and authenticated (or `token` provided).
 */
export async function fetchPrLocally(options: FetchPrLocallyOptions): Promise<ChangeSet> {
  const { repoPath, prNumber, token } = options;

  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  if (token) env['GH_TOKEN'] = token;

  const diffArgs = ['pr', 'diff', String(prNumber), '--repo', repoPath];
  const diff = await $`gh ${diffArgs}`.cwd(repoPath).env(env).quiet().text();

  const view = await ghJson<GhPrView>(
    [
      'pr',
      'view',
      String(prNumber),
      '--repo',
      repoPath,
      '--json',
      'baseRefName,headRefName,headRefOid,baseRefOid,number,title,body,author,headRepository,baseRepository',
    ],
    token,
  );

  const files = parseUnifiedDiff(diff);
  const commits = await readCommits(repoPath, view.baseRefOid, view.headRefOid);

  const headRepoId = Number(view.headRepository?.id ?? '0') || 0;
  const baseRepoId = Number(view.baseRepository?.id ?? '0') || 0;

  return {
    baseSha: view.baseRefOid,
    headSha: view.headRefOid,
    files,
    commits,
    prMetadata: {
      number: view.number,
      title: view.title,
      body: view.body ?? '',
      head: { sha: view.headRefOid, repo: { id: headRepoId } },
      base: { sha: view.baseRefOid, repo: { id: baseRepoId } },
      user: { type: view.author?.is_bot ? 'Bot' : 'User' },
    },
  };
}
