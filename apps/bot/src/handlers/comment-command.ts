// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { metricsInfo, metricsWarn } from '@azri/core';

export type AzriCommand =
  | { kind: 'regenerate' }
  | { kind: 'hide' }
  | { kind: 'focus'; area: string }
  | { kind: 'brief' };

const AUTHORIZED_ASSOCIATIONS: ReadonlySet<string> = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

const COMMAND_PATTERN = /^\/azri\s+(\w+)(?:\s+(.+))?/iu;

export function parseCommand(body: string): AzriCommand | null {
  const match = body.trim().match(COMMAND_PATTERN);
  if (!match) return null;
  const cmd = match[1]?.toLowerCase();
  const arg = match[2]?.trim();
  switch (cmd) {
    case 'regenerate':
      return { kind: 'regenerate' };
    case 'hide':
      return { kind: 'hide' };
    case 'brief':
      return { kind: 'brief' };
    case 'focus':
      return arg ? { kind: 'focus', area: arg } : null;
    default:
      return null;
  }
}

export interface CommentCommandPayload {
  action: string;
  comment: {
    id: number;
    body: string;
    author_association: string;
  };
  issue: { number: number; pull_request?: unknown };
  repository: { owner: { login: string }; name: string };
}

export interface CommentCommandOctokit {
  rest: {
    reactions: {
      createForIssueComment: (params: {
        owner: string;
        repo: string;
        comment_id: number;
        content: 'eyes' | '+1' | '-1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket';
      }) => Promise<unknown>;
    };
  };
}

export interface CommentCommandDeps {
  octokit: CommentCommandOctokit | null;
  onPipelineInvoke?: (cmd: AzriCommand, prNumber: number) => Promise<void>;
}

export interface CommentCommandResult {
  acted: boolean;
}

async function tryReact(
  octokit: CommentCommandOctokit | null,
  owner: string,
  repo: string,
  commentId: number,
): Promise<void> {
  if (!octokit) return;
  try {
    await octokit.rest.reactions.createForIssueComment({
      owner,
      repo,
      comment_id: commentId,
      content: 'eyes',
    });
  } catch {
    // Reactions are best-effort; ignore failures.
  }
}

export async function handleCommentCommand(args: {
  payload: CommentCommandPayload;
  deps: CommentCommandDeps;
}): Promise<CommentCommandResult> {
  const { payload, deps } = args;

  if (payload.action !== 'created') return { acted: false };
  if (!payload.issue.pull_request) return { acted: false };

  const cmd = parseCommand(payload.comment.body);
  if (!cmd) return { acted: false };

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const commentId = payload.comment.id;
  const prNumber = payload.issue.number;

  if (!AUTHORIZED_ASSOCIATIONS.has(payload.comment.author_association)) {
    metricsWarn('comment-command.unauthorized', {
      author_association: payload.comment.author_association,
      kind: cmd.kind,
      prNumber,
    });
    await tryReact(deps.octokit, owner, repo, commentId);
    return { acted: false };
  }

  metricsInfo('comment-command.received', { kind: cmd.kind, prNumber });
  await tryReact(deps.octokit, owner, repo, commentId);

  if (deps.onPipelineInvoke) {
    try {
      await deps.onPipelineInvoke(cmd, prNumber);
    } catch (e) {
      metricsWarn('comment-command.pipeline-invoke-error', {
        kind: cmd.kind,
        prNumber,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { acted: true };
}
