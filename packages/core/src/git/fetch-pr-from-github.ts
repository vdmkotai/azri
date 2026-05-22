// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { ChangeSet, Commit } from '@azri/types';

import { parseUnifiedDiff } from './parse-diff.ts';

export interface OctokitGitHubClient {
  rest: {
    pulls: {
      get: (params: { owner: string; repo: string; pull_number: number }) => Promise<{
        data: {
          number: number;
          title: string;
          body: string | null;
          base: { sha: string; repo: { id: number } };
          head: { sha: string; repo: { id: number } };
          user: { type: 'User' | 'Bot' } | null;
        };
      }>;
      listCommits: (params: {
        owner: string;
        repo: string;
        pull_number: number;
        per_page?: number;
      }) => Promise<{
        data: Array<{
          sha: string;
          commit: { message: string; author: { name: string; date: string } | null };
        }>;
      }>;
    };
  };
  request: (
    route: string,
    params: Record<string, unknown> & {
      owner: string;
      repo: string;
      pull_number: number;
      headers?: Record<string, string>;
    },
  ) => Promise<{ data: string }>;
}

export interface FetchPrFromGitHubOptions {
  owner: string;
  repo: string;
  prNumber: number;
  octokit: OctokitGitHubClient;
}

/**
 * Fetch a pull request via Octokit (preferred path for the bot).
 * Returns a fully populated ChangeSet including PR metadata and commits.
 */
export async function fetchPrFromGitHub(options: FetchPrFromGitHubOptions): Promise<ChangeSet> {
  const { owner, repo, prNumber, octokit } = options;

  const pull = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber });

  const diffResp = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner,
    repo,
    pull_number: prNumber,
    headers: { accept: 'application/vnd.github.v3.diff' },
  });

  const diff = typeof diffResp.data === 'string' ? diffResp.data : String(diffResp.data ?? '');
  const files = parseUnifiedDiff(diff);

  const commitsResp = await octokit.rest.pulls.listCommits({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  const commits: Commit[] = commitsResp.data.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    authorName: c.commit.author?.name ?? '',
    authoredAt: c.commit.author?.date ?? '',
  }));

  return {
    baseSha: pull.data.base.sha,
    headSha: pull.data.head.sha,
    files,
    commits,
    prMetadata: {
      number: pull.data.number,
      title: pull.data.title,
      body: pull.data.body ?? '',
      head: { sha: pull.data.head.sha, repo: { id: pull.data.head.repo.id } },
      base: { sha: pull.data.base.sha, repo: { id: pull.data.base.repo.id } },
      user: { type: pull.data.user?.type ?? 'User' },
    },
  };
}
