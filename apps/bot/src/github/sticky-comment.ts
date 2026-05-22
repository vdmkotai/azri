// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export const STICKY_MARKER = '<!-- azri-marker:v1 -->';

export interface RunMetaForComment {
  runId: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  durationMs: number;
}

export function formatRunningBody(): string {
  return `${STICKY_MARKER}\n\n⏳ **Azri is generating a PR explainer...**\n\nThis usually takes 30–60 seconds.`;
}

export function formatSuccessBody(url: string, meta: RunMetaForComment): string {
  const seconds = (meta.durationMs / 1000).toFixed(1);
  const tokens = meta.tokensIn + meta.tokensOut;
  const cost = meta.costUsd.toFixed(4);
  const runShort = meta.runId.slice(0, 8);
  return `${STICKY_MARKER}\n\n🪶 **Azri PR explainer ready** → [Open explainer](${url})\n\n<sub>Generated in ${seconds}s · ${tokens} tokens · $${cost} · run ${runShort}</sub>`;
}

export function formatFailureBody(err: Error, meta: Partial<RunMetaForComment>): string {
  const message = (err.message ?? String(err)).slice(0, 500);
  const runFooter = meta.runId ? `Run: ${meta.runId.slice(0, 8)}` : '';
  return `${STICKY_MARKER}\n\n❗ **Azri generation failed.**\n\n<details><summary>Details</summary>\n\n\`\`\`\n${message}\n\`\`\`\n\n${runFooter}\n</details>\n\nReport at https://github.com/vkotai/azri/issues`;
}

export function formatTooLargeBody(stats: { files: number; lines: number }): string {
  return `${STICKY_MARKER}\n\n📦 **PR too large for Azri** — ${stats.files} files / ${stats.lines} lines (cap: 200 files / 10K lines). Consider splitting.`;
}

export function formatForkedBody(url: string): string {
  return `${STICKY_MARKER}\n\n🪶 **Azri PR explainer** (forked PR — degraded mode) → [Open](${url})`;
}

export function formatSkipBody(reason: string): string {
  return `${STICKY_MARKER}\n\n⏭️  **Azri skipped this PR** (reason: ${reason}).`;
}

export interface StickyOctokit {
  graphql: (query: string, vars: Record<string, unknown>) => Promise<unknown>;
  rest: {
    issues: {
      createComment: (params: {
        owner: string;
        repo: string;
        issue_number: number;
        body: string;
      }) => Promise<{ data: { id: number } }>;
      updateComment: (params: {
        owner: string;
        repo: string;
        comment_id: number;
        body: string;
      }) => Promise<{ data: { id: number } }>;
      listComments?: (params: {
        owner: string;
        repo: string;
        issue_number: number;
        per_page?: number;
      }) => Promise<{ data: Array<{ id: number; body?: string | null }> }>;
    };
  };
}

interface GraphqlCommentsResponse {
  repository?: {
    pullRequest?: {
      comments?: {
        nodes?: Array<{ databaseId?: number; body?: string }>;
      };
    };
  };
}

const FIND_COMMENT_QUERY = `query($owner:String!,$repo:String!,$num:Int!){
  repository(owner:$owner,name:$repo){
    pullRequest(number:$num){
      comments(first:100){
        nodes{databaseId body}
      }
    }
  }
}`;

export async function findExistingComment(
  octokit: StickyOctokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<{ id: number } | null> {
  try {
    const res = (await octokit.graphql(FIND_COMMENT_QUERY, {
      owner,
      repo,
      num: prNumber,
    })) as GraphqlCommentsResponse;
    const nodes = res.repository?.pullRequest?.comments?.nodes ?? [];
    for (const node of nodes) {
      if (
        typeof node.body === 'string' &&
        node.body.includes(STICKY_MARKER) &&
        typeof node.databaseId === 'number'
      ) {
        return { id: node.databaseId };
      }
    }
    return null;
  } catch {
    return findExistingCommentViaRest(octokit, owner, repo, prNumber);
  }
}

async function findExistingCommentViaRest(
  octokit: StickyOctokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<{ id: number } | null> {
  const listComments = octokit.rest.issues.listComments;
  if (!listComments) return null;
  try {
    const res = await listComments({ owner, repo, issue_number: prNumber, per_page: 100 });
    for (const c of res.data) {
      if (typeof c.body === 'string' && c.body.includes(STICKY_MARKER)) {
        return { id: c.id };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function upsertStickyComment(
  octokit: StickyOctokit,
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
): Promise<{ id: number; created: boolean }> {
  const existing = await findExistingComment(octokit, owner, repo, prNumber);
  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    return { id: existing.id, created: false };
  }
  const created = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
  return { id: created.data.id, created: true };
}
