// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createHmac, timingSafeEqual } from 'node:crypto';
import { metricsInfo, metricsWarn } from '@azri/core';
import { Effect } from 'effect';
import { HttpServerRequest, HttpServerResponse } from 'effect/unstable/http';
import { loadBotConfig } from '../config.ts';

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

export const webhookHandler = (request: HttpServerRequest.HttpServerRequest) =>
  Effect.gen(function* () {
    const rawBody = yield* Effect.orElseSucceed(request.text, () => '');

    const deliveryId = request.headers['x-github-delivery'] ?? 'unknown';
    const githubEvent = request.headers['x-github-event'] ?? 'unknown';
    const signature = request.headers['x-hub-signature-256'] ?? '';

    const cfg = loadBotConfig();
    const candidates = [cfg.githubWebhookSecret, ...cfg.additionalWebhookSecrets];
    const secrets = candidates.filter(Boolean) as string[];

    if (secrets.length === 0) {
      metricsWarn('webhook.no-secret-configured', { deliveryId, githubEvent });
      return HttpServerResponse.text('Webhook secret not configured', { status: 500 });
    }

    if (!verifySignature(rawBody, signature, secrets)) {
      metricsWarn('webhook.bad-signature', { deliveryId, githubEvent });
      return HttpServerResponse.text('Invalid signature', { status: 401 });
    }

    metricsInfo('webhook.received', { deliveryId, githubEvent, bodyBytes: rawBody.length });
    return yield* HttpServerResponse.json({ received: true, event: githubEvent });
  });
