// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type {
  OctokitGitHubClient,
  OctokitRepoClient,
} from '../../../packages/core/src/git/index.ts';

export interface CliGitHubClient {
  rest: OctokitGitHubClient['rest'] & OctokitRepoClient['rest'];
  request: OctokitGitHubClient['request'];
}

export class GitHubHttpError extends Error {
  readonly _tag = 'GitHubHttpError';
  readonly status: number;
  readonly url: string;
  readonly rateLimitRemaining: number | null;

  constructor(status: number, url: string, rateLimitRemaining: number | null, message: string) {
    super(message);
    this.name = 'GitHubHttpError';
    this.status = status;
    this.url = url;
    this.rateLimitRemaining = rateLimitRemaining;
  }
}

const API_BASE = 'https://api.github.com';
const DEFAULT_HEADERS: Record<string, string> = {
  accept: 'application/vnd.github+json',
  'user-agent': 'azri-cli',
  'x-github-api-version': '2022-11-28',
};

function makeHeaders(
  token: string | undefined,
  extra: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...DEFAULT_HEADERS, ...extra };
  if (token) out.authorization = `Bearer ${token}`;
  return out;
}

async function get(
  path: string,
  token: string | undefined,
  extraHeaders: Record<string, string>,
  asText: boolean,
): Promise<unknown> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { method: 'GET', headers: makeHeaders(token, extraHeaders) });
  if (!res.ok) {
    const remainingHeader = res.headers.get('x-ratelimit-remaining');
    const remaining = remainingHeader ? Number.parseInt(remainingHeader, 10) : null;
    let body = '';
    try {
      body = await res.text();
    } catch {
      body = '';
    }
    const tail = body ? `: ${body.slice(0, 200)}` : '';
    throw new GitHubHttpError(
      res.status,
      url,
      Number.isFinite(remaining) ? remaining : null,
      `GitHub API ${res.status} ${res.statusText} for ${url}${tail}`,
    );
  }
  return asText ? await res.text() : await res.json();
}

function enc(value: string): string {
  return encodeURIComponent(value);
}

type PullGetData = Awaited<ReturnType<OctokitGitHubClient['rest']['pulls']['get']>>['data'];
type ListCommitsData = Awaited<
  ReturnType<OctokitGitHubClient['rest']['pulls']['listCommits']>
>['data'];
export interface GitHubPrFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}
type ReposGetData = Awaited<ReturnType<OctokitRepoClient['rest']['repos']['get']>>['data'];
type ReadmeData = Awaited<
  ReturnType<NonNullable<OctokitRepoClient['rest']['repos']['getReadme']>>
>['data'];

export async function listPrFiles(
  owner: string,
  repo: string,
  prNumber: number,
  token: string | undefined,
): Promise<GitHubPrFile[]> {
  const data = await get(
    `/repos/${enc(owner)}/${enc(repo)}/pulls/${prNumber}/files?per_page=100`,
    token,
    {},
    false,
  );
  return data as GitHubPrFile[];
}

export function createGitHubClient(token: string | undefined): CliGitHubClient {
  return {
    rest: {
      pulls: {
        get: async ({ owner, repo, pull_number: prNumber }) => {
          const data = (await get(
            `/repos/${enc(owner)}/${enc(repo)}/pulls/${prNumber}`,
            token,
            {},
            false,
          )) as PullGetData;
          return { data };
        },
        listCommits: async ({ owner, repo, pull_number: prNumber, per_page: perPage }) => {
          const qs = perPage ? `?per_page=${perPage}` : '';
          const data = (await get(
            `/repos/${enc(owner)}/${enc(repo)}/pulls/${prNumber}/commits${qs}`,
            token,
            {},
            false,
          )) as ListCommitsData;
          return { data };
        },
      },
      repos: {
        get: async ({ owner, repo }) => {
          const data = (await get(
            `/repos/${enc(owner)}/${enc(repo)}`,
            token,
            {},
            false,
          )) as ReposGetData;
          return { data };
        },
        getReadme: async ({ owner, repo }) => {
          const data = (await get(
            `/repos/${enc(owner)}/${enc(repo)}/readme`,
            token,
            {},
            false,
          )) as ReadmeData;
          return { data };
        },
      },
    },
    request: async (route, params) => {
      const idx = route.indexOf(' ');
      const method = idx > 0 ? route.slice(0, idx).toUpperCase() : 'GET';
      if (method !== 'GET') throw new Error(`Unsupported method: ${method}`);
      let path = idx > 0 ? route.slice(idx + 1) : route;
      for (const key of Object.keys(params)) {
        if (key === 'headers') continue;
        const value = (params as Record<string, unknown>)[key];
        if (typeof value === 'string' || typeof value === 'number') {
          path = path.replace(`{${key}}`, String(value));
        }
      }
      const extraHeaders = (params.headers ?? {}) as Record<string, string>;
      const data = (await get(path, token, extraHeaders, true)) as string;
      return { data };
    },
  };
}
