// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { RepoSnapshot } from '@azri/types';

export interface OctokitRepoClient {
  rest: {
    repos: {
      get: (params: { owner: string; repo: string }) => Promise<{
        data: {
          default_branch: string;
        };
      }>;
      getReadme?: (params: { owner: string; repo: string }) => Promise<{
        data: { content: string; encoding: string };
      }>;
    };
  };
}

export interface ReadRepoSnapshotFromGitHubOptions {
  owner: string;
  repo: string;
  octokit: OctokitRepoClient;
}

/**
 * Fetch a minimal `RepoSnapshot` via the GitHub API. This is enough for PR-mode
 * orchestration where the snapshot is mostly ambient context — the `ChangeSet`
 * carries the meaningful per-file data.
 *
 * For repo-mode generation a richer snapshot (file tree + per-file stats) is
 * required and should be assembled separately.
 */
export async function readRepoSnapshotFromGitHub(
  options: ReadRepoSnapshotFromGitHubOptions,
): Promise<RepoSnapshot> {
  const { owner, repo, octokit } = options;

  let defaultBranch = '';
  try {
    const repoResp = await octokit.rest.repos.get({ owner, repo });
    defaultBranch = repoResp.data.default_branch ?? '';
  } catch {
    // Best effort — leave defaultBranch empty when the API call fails.
  }

  let readme: string | null = null;
  if (octokit.rest.repos.getReadme) {
    try {
      const readmeResp = await octokit.rest.repos.getReadme({ owner, repo });
      const { content, encoding } = readmeResp.data;
      if (typeof content === 'string' && encoding === 'base64') {
        readme = Buffer.from(content, 'base64').toString('utf8');
      }
    } catch {
      // No README or no permission; leave null.
    }
  }

  return {
    owner,
    name: repo,
    defaultBranch,
    readme,
    languages: {},
    packageManifests: {},
    fileTree: [],
    capturedAt: new Date().toISOString(),
  };
}
