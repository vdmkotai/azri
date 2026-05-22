// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createLocalHostingAdapter } from '@azri/adapter-hosting-local';
import {
  fetchPrFromGitHub,
  metricsError,
  metricsInfo,
  metricsWarn,
  readRepoSnapshotFromGitHub,
  runAzri,
  type OctokitGitHubClient,
  type OctokitRepoClient,
} from '@azri/core';
import type { AzriRunInput, AzriRunOutput } from '@azri/types';

import { loadBotConfig } from '../config.ts';
import {
  createCheckRun,
  formatFailureBody,
  formatForkedBody,
  formatRunningBody,
  formatSkipBody,
  formatSuccessBody,
  formatTooLargeBody,
  getInstallationOctokit,
  updateCheckRun,
  upsertStickyComment,
  type CheckRunOctokit,
  type RunMetaForComment,
  type StickyOctokit,
  type UpdateCheckRunOptions,
} from '../github/index.ts';
import { shouldProcessPr } from '../self-bootstrap.ts';
import {
  handleCommentCommand,
  parseCommand,
  type CommentCommandOctokit,
  type CommentCommandPayload,
} from './comment-command.ts';

export interface PullRequestPayload {
  action: string;
  installation?: { id: number };
  repository: { owner: { login: string }; name: string };
  pull_request: {
    number: number;
    head: { sha: string };
    user?: { type?: string };
  };
}

export interface OctokitClient {
  graphql: StickyOctokit['graphql'];
  request: OctokitGitHubClient['request'];
  rest: {
    issues: StickyOctokit['rest']['issues'];
    checks: CheckRunOctokit['rest']['checks'];
    reactions: CommentCommandOctokit['rest']['reactions'];
    repos: OctokitRepoClient['rest']['repos'];
    pulls: OctokitGitHubClient['rest']['pulls'];
  };
}

function metaForComment(meta: AzriRunOutput['metadata']): RunMetaForComment {
  return {
    runId: meta.runId,
    tokensIn: meta.tokensIn,
    tokensOut: meta.tokensOut,
    costUsd: meta.costUsd,
    durationMs: meta.durationMs,
  };
}

async function postFailureSticky(
  octokit: StickyOctokit,
  owner: string,
  repo: string,
  prNumber: number,
  message: string,
  runMeta: Partial<RunMetaForComment>,
): Promise<void> {
  try {
    await upsertStickyComment(
      octokit,
      owner,
      repo,
      prNumber,
      formatFailureBody(new Error(message), runMeta),
    );
  } catch (e) {
    metricsWarn('webhook.pr.failure-sticky.failed', {
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }
}

async function completeCheckRunSafely(
  octokit: CheckRunOctokit,
  owner: string,
  repo: string,
  checkRunId: number,
  opts: UpdateCheckRunOptions,
): Promise<void> {
  try {
    await updateCheckRun(octokit, owner, repo, checkRunId, opts);
  } catch (e) {
    metricsWarn('webhook.pr.check-run-update.failed', {
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }
}

async function handleRunResult(
  result: AzriRunOutput,
  ctx: {
    octokit: OctokitClient;
    owner: string;
    repo: string;
    prNumber: number;
    isFork: boolean;
    checkRunId: number | null;
  },
): Promise<void> {
  const { octokit, owner, repo, prNumber, isFork, checkRunId } = ctx;

  if (result.kind === 'ok' || result.kind === 'cache-hit') {
    const cfg = loadBotConfig();
    const hosting = createLocalHostingAdapter({
      baseDir: cfg.dataDir,
      ...(cfg.publicBaseUrl ? { publicBaseUrl: cfg.publicBaseUrl } : {}),
    });
    const publishResult = await hosting.publish(result.htmlBundle, {
      kind: 'pr',
      owner,
      repo,
      prNumber,
      runId: result.metadata.runId,
    });
    const body = isFork
      ? formatForkedBody(publishResult.url)
      : formatSuccessBody(publishResult.url, metaForComment(result.metadata));
    await upsertStickyComment(octokit, owner, repo, prNumber, body);
    if (checkRunId !== null) {
      await completeCheckRunSafely(octokit, owner, repo, checkRunId, {
        conclusion: 'success',
        title: 'Azri preview ready',
        summary: `[Open explainer](${publishResult.url})`,
        detailsUrl: publishResult.url,
      });
    }
    return;
  }

  if (result.kind === 'too-large') {
    await upsertStickyComment(octokit, owner, repo, prNumber, formatTooLargeBody(result.stats));
    if (checkRunId !== null) {
      await completeCheckRunSafely(octokit, owner, repo, checkRunId, {
        conclusion: 'neutral',
        title: 'PR too large for Azri',
        summary: `${result.stats.files} files / ${result.stats.lines} lines`,
      });
    }
    return;
  }

  if (result.kind === 'skip') {
    await upsertStickyComment(octokit, owner, repo, prNumber, formatSkipBody(result.reason));
    if (checkRunId !== null) {
      await completeCheckRunSafely(octokit, owner, repo, checkRunId, {
        conclusion: 'neutral',
        title: `Azri skipped: ${result.reason}`,
        summary: 'Azri did not generate an explainer for this PR.',
      });
    }
    return;
  }

  const message =
    result.kind === 'failure' ? result.error.message : `Unexpected result: ${result.kind}`;
  await postFailureSticky(octokit, owner, repo, prNumber, message, metaForComment(result.metadata));
  if (checkRunId !== null) {
    await completeCheckRunSafely(octokit, owner, repo, checkRunId, {
      conclusion: 'failure',
      title: 'Azri generation failed',
      summary: message.slice(0, 500),
    });
  }
}

export async function processPullRequest(payload: PullRequestPayload): Promise<void> {
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const prNumber = payload.pull_request.number;
  const headSha = payload.pull_request.head.sha;
  const installationId = payload.installation?.id;

  if (!installationId) {
    metricsWarn('webhook.pr.no-installation', { owner, repo, prNumber });
    return;
  }
  if (!shouldProcessPr(payload)) {
    metricsInfo('webhook.pr.self-bootstrap-skipped', { owner, repo, prNumber });
    return;
  }
  if (payload.pull_request.user?.type === 'Bot') {
    metricsInfo('webhook.pr.bot-author-skipped', { owner, repo, prNumber });
    return;
  }

  const octokit = (await getInstallationOctokit(installationId)) as OctokitClient | null;
  if (!octokit) {
    metricsError('webhook.pr.no-octokit', { owner, repo, prNumber });
    return;
  }

  let checkRunId: number | null = null;
  try {
    const cr = await createCheckRun(octokit, owner, repo, headSha);
    checkRunId = cr.id;
  } catch (e) {
    metricsWarn('webhook.pr.check-run-create.failed', {
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    await upsertStickyComment(octokit, owner, repo, prNumber, formatRunningBody());
  } catch (e) {
    metricsWarn('webhook.pr.initial-sticky.failed', {
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    const repoSnap = await readRepoSnapshotFromGitHub({ owner, repo, octokit });
    const change = await fetchPrFromGitHub({ owner, repo, prNumber, octokit });
    const isFork =
      change.prMetadata !== undefined &&
      change.prMetadata.head.repo.id !== change.prMetadata.base.repo.id;

    const input: AzriRunInput = { mode: 'pr', repo: repoSnap, change, config: {} };
    const result = await runAzri(input, {});

    await handleRunResult(result, { octokit, owner, repo, prNumber, isFork, checkRunId });
    metricsInfo('webhook.pr.done', { owner, repo, prNumber, kind: result.kind });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    metricsError('webhook.pr.processing-error', { owner, repo, prNumber, errorMessage: message });
    await postFailureSticky(octokit, owner, repo, prNumber, message, {});
    if (checkRunId !== null) {
      await completeCheckRunSafely(octokit, owner, repo, checkRunId, {
        conclusion: 'failure',
        title: 'Azri generation failed',
        summary: message.slice(0, 500),
      });
    }
  }
}

export async function processIssueComment(payload: CommentCommandPayload): Promise<void> {
  const cmd = parseCommand(payload.comment.body ?? '');
  if (!cmd) return;

  const installationId = (payload as unknown as { installation?: { id: number } }).installation?.id;
  const octokit = installationId
    ? ((await getInstallationOctokit(installationId)) as CommentCommandOctokit | null)
    : null;

  await handleCommentCommand({
    payload,
    deps: {
      octokit,
      onPipelineInvoke: async (parsed, prNumber) => {
        metricsInfo('comment-command.dispatched', { kind: parsed.kind, prNumber });
      },
    },
  });
}
