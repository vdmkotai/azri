// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createHmac, randomUUID } from 'node:crypto';

const port = '13099';
const baseUrl = `http://localhost:${port}`;
const webhookSecret = 'synthetic-webhook-secret';
const privateKeyPath = new URL('../fixtures/test-private-key.pem', import.meta.url);
const pullRequestFixturePath = new URL(
  '../fixtures/webhooks/pull-request-opened.json',
  import.meta.url,
);
const issueCommentFixturePath = new URL(
  '../fixtures/webhooks/issue-comment-created.json',
  import.meta.url,
);

let subprocess: ReturnType<typeof Bun.spawn> | undefined;

function sign(rawBody: string): string {
  return `sha256=${createHmac('sha256', webhookSecret).update(rawBody).digest('hex')}`;
}

async function readJsonFixture(path: URL): Promise<unknown> {
  return JSON.parse(await Bun.file(path).text());
}

async function waitForHealthz(timeoutMs: number): Promise<void> {
  const startedAt = Date.now();
  let lastError = 'server did not respond';

  while (Date.now() - startedAt < timeoutMs) {
    if (subprocess?.exitCode !== null) {
      const stderr = subprocess.stderr ? await new Response(subprocess.stderr).text() : '';
      throw new Error(
        `bot exited before becoming healthy with code ${String(subprocess.exitCode)}${
          stderr ? `: ${stderr}` : ''
        }`,
      );
    }

    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.status === 200) return;
      lastError = `healthz returned ${String(response.status)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await Bun.sleep(100);
  }

  throw new Error(`bot failed to start within ${String(timeoutMs)}ms: ${lastError}`);
}

async function postWebhook(event: string, payload: unknown, signature?: string): Promise<Response> {
  const rawBody = JSON.stringify(payload);

  return fetch(`${baseUrl}/webhooks/github`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': signature ?? sign(rawBody),
      'x-github-event': event,
      'x-github-delivery': randomUUID(),
    },
    body: rawBody,
    signal: AbortSignal.timeout(1_000),
  });
}

async function expectAcceptedWithinOneSecond(event: string, payload: unknown): Promise<Response> {
  const startedAt = performance.now();
  const response = await postWebhook(event, payload);
  const elapsedMs = performance.now() - startedAt;

  expect(elapsedMs).toBeLessThanOrEqual(1_000);
  expect([200, 202]).toContain(response.status);
  await response.text();
  return response;
}

describe('e2e: synthetic webhook', () => {
  beforeAll(async () => {
    const privateKey = await Bun.file(privateKeyPath).text();

    subprocess = Bun.spawn(['bun', 'run', 'apps/bot/src/server.ts'], {
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: 'fake-key',
        AZRI_LLM_PROVIDER: 'mock',
        GITHUB_APP_ID: '12345',
        GITHUB_PRIVATE_KEY: privateKey,
        GITHUB_WEBHOOK_SECRET: webhookSecret,
        NODE_ENV: 'test',
        PORT: port,
      },
      stderr: 'pipe',
      stdout: 'pipe',
    });

    await waitForHealthz(5_000);
  });

  afterAll(async () => {
    if (!subprocess || subprocess.exitCode !== null) return;

    subprocess.kill('SIGTERM');
    await subprocess.exited;
  });

  test('pull_request.opened', async () => {
    const payload = await readJsonFixture(pullRequestFixturePath);

    await expectAcceptedWithinOneSecond('pull_request', payload);
  });

  test('fork-PR mode', async () => {
    const payload = (await readJsonFixture(pullRequestFixturePath)) as {
      pull_request: { head: { repo: { id: number } }; base: { repo: { id: number } } };
    };
    payload.pull_request.head.repo.id = payload.pull_request.base.repo.id + 1;

    await expectAcceptedWithinOneSecond('pull_request', payload);
  });

  test('issue_comment with /azri regenerate', async () => {
    const payload = await readJsonFixture(issueCommentFixturePath);

    await expectAcceptedWithinOneSecond('issue_comment', payload);
  });

  test('bad signature', async () => {
    const payload = await readJsonFixture(pullRequestFixturePath);
    const response = await postWebhook('pull_request', payload, 'sha256=not-a-valid-signature');

    expect([401, 403]).toContain(response.status);
    await response.text();
  });
});
