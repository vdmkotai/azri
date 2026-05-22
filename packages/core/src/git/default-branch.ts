// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { $ } from 'bun';

export interface OctokitLike {
  rest: {
    repos: {
      get: (params: { owner: string; repo: string }) => Promise<{
        data: { default_branch: string };
      }>;
    };
  };
}

export interface GetDefaultBranchOptions {
  owner: string;
  repo: string;
  octokit?: OctokitLike;
  repoPath?: string;
}

async function fromOctokit(
  octokit: OctokitLike,
  owner: string,
  repo: string,
): Promise<string | null> {
  try {
    const response = await octokit.rest.repos.get({ owner, repo });
    const branch = response.data.default_branch;
    return branch && branch.length > 0 ? branch : null;
  } catch {
    return null;
  }
}

async function fromLocalGit(repoPath: string | undefined): Promise<string | null> {
  try {
    const cwd = repoPath ?? process.cwd();
    const result = await $`git -C ${cwd} symbolic-ref --quiet refs/remotes/origin/HEAD`
      .quiet()
      .text();
    const trimmed = result.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^refs\/remotes\/origin\/(.+)$/u);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Determine the default branch for a repository. Tries Octokit first (when provided),
 * then falls back to `git symbolic-ref refs/remotes/origin/HEAD`.
 * Returns `null` when undetermined; NEVER returns a hardcoded "main" fallback.
 */
export async function getDefaultBranch(options: GetDefaultBranchOptions): Promise<string | null> {
  if (options.octokit) {
    const fromApi = await fromOctokit(options.octokit, options.owner, options.repo);
    if (fromApi) return fromApi;
  }
  return fromLocalGit(options.repoPath);
}
