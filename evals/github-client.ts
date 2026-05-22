// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { OctokitGitHubClient } from '@azri/core';

type GitHubClient = OctokitGitHubClient & {
  rest: OctokitGitHubClient['rest'] & {
    repos: {
      get: (params: {
        owner: string;
        repo: string;
      }) => Promise<{ data: { default_branch: string } }>;
      getReadme: (params: {
        owner: string;
        repo: string;
      }) => Promise<{ data: { content: string; encoding: string } }>;
    };
  };
};

export function makeGitHubClient(): GitHubClient {
  return {
    rest: {
      pulls: {
        get: (params) =>
          githubJson(`/repos/${params.owner}/${params.repo}/pulls/${params.pull_number}`),
        listCommits: (params) =>
          githubJson(
            `/repos/${params.owner}/${params.repo}/pulls/${params.pull_number}/commits?per_page=${params.per_page ?? 100}`,
          ),
      },
      repos: {
        get: (params) => githubJson(`/repos/${params.owner}/${params.repo}`),
        getReadme: (params) => githubJson(`/repos/${params.owner}/${params.repo}/readme`),
      },
    },
    request: (_route, params) =>
      githubText(`/repos/${params.owner}/${params.repo}/pulls/${params.pull_number}`, {
        accept: String(params.headers?.['accept'] ?? 'application/vnd.github.v3.diff'),
      }),
  };
}

async function githubJson(path: string): Promise<{ data: never }> {
  const response = await githubFetch(path, { accept: 'application/vnd.github+json' });
  return { data: (await response.json()) as never };
}

async function githubText(
  path: string,
  headers: Record<string, string>,
): Promise<{ data: string }> {
  const response = await githubFetch(path, headers);
  return { data: await response.text() };
}

async function githubFetch(path: string, headers: Record<string, string>): Promise<Response> {
  const token = process.env['GITHUB_TOKEN'];
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      ...headers,
      'user-agent': 'azri-eval-harness',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${await response.text()}`);
  return response;
}
