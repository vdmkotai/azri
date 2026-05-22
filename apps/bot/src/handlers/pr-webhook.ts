// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createHmac, timingSafeEqual } from 'node:crypto';

import { metricsError, metricsInfo, metricsWarn } from '@azri/core';
import { Effect } from 'effect';
import { HttpServerRequest, HttpServerResponse } from 'effect/unstable/http';

import { loadBotConfig } from '../config.ts';
import type { CommentCommandPayload } from './comment-command.ts';
import { processIssueComment, processPullRequest, type PullRequestPayload } from './pr-process.ts';

const DEDUP_MAX = 1000;
const DEDUP_TTL_MS = 24 * 60 * 60 * 1000;
const SUPPORTED_PR_ACTIONS: ReadonlySet<string> = new Set(['opened', 'synchronize', 'reopened']);

const seenDeliveries = new Map<string, number>();

function dedup(deliveryId: string): boolean {
  const now = Date.now();
  for (const [id, ts] of seenDeliveries) {
    if (ts < now - DEDUP_TTL_MS) seenDeliveries.delete(id);
  }
  if (seenDeliveries.has(deliveryId)) return true;
  if (seenDeliveries.size >= DEDUP_MAX) {
    const oldest = seenDeliveries.keys().next().value;
    if (oldest) seenDeliveries.delete(oldest);
  }
  seenDeliveries.set(deliveryId, now);
  return false;
}

function verifySignature(rawBody: string, signatureHeader: string, secrets: string[]): boolean {
  if (!signatureHeader) return false;
  for (const secret of secrets) {
    if (!secret) continue;
    const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
    const actual = Buffer.from(signatureHeader);
    const expectedBuf = Buffer.from(expected);
    if (actual.length !== expectedBuf.length) continue;
    try {
      if (timingSafeEqual(actual, expectedBuf)) return true;
    } catch {
      continue;
    }
  }
  return false;
}

function scheduleAsync(fn: () => Promise<void>, label: string): void {
  setImmediate(() => {
    fn().catch((e: unknown) => {
      metricsError(label, {
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    });
  });
}

export const prWebhookHandler = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const rawBody = yield* Effect.orElseSucceed(request.text, () => '');

  const deliveryId = request.headers['x-github-delivery'] ?? 'unknown';
  const githubEvent = request.headers['x-github-event'] ?? 'unknown';
  const signature = request.headers['x-hub-signature-256'] ?? '';

  const cfg = loadBotConfig();
  const candidateSecrets = [cfg.githubWebhookSecret, ...cfg.additionalWebhookSecrets];
  const secrets = candidateSecrets.filter((s): s is string => !!s);

  if (secrets.length === 0) {
    metricsWarn('webhook.no-secret-configured', { deliveryId, githubEvent });
    return HttpServerResponse.text('Webhook secret not configured', { status: 500 });
  }

  if (!verifySignature(rawBody, signature, secrets)) {
    metricsWarn('webhook.bad-signature', { deliveryId, githubEvent });
    return HttpServerResponse.text('Invalid signature', { status: 401 });
  }

  if (dedup(deliveryId)) {
    metricsInfo('webhook.deduped', { deliveryId, githubEvent });
    return yield* HttpServerResponse.json({ deduped: true });
  }

  metricsInfo('webhook.received', { deliveryId, githubEvent, bodyBytes: rawBody.length });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    metricsWarn('webhook.json-parse.failed', {
      deliveryId,
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return HttpServerResponse.text('Invalid JSON', { status: 400 });
  }

  if (githubEvent === 'pull_request') {
    const pr = payload as PullRequestPayload;
    if (SUPPORTED_PR_ACTIONS.has(pr.action)) {
      scheduleAsync(() => processPullRequest(pr), 'webhook.pr.scheduled-error');
    } else {
      metricsInfo('webhook.pr.action-ignored', { action: pr.action });
    }
  } else if (githubEvent === 'issue_comment') {
    const ic = payload as CommentCommandPayload;
    scheduleAsync(() => processIssueComment(ic), 'webhook.issue-comment.scheduled-error');
  }

  return yield* HttpServerResponse.json({ received: true, event: githubEvent });
});
