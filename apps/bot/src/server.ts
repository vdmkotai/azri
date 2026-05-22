// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { metricsInfo, metricsWarn } from '@azri/core';
import { HttpRouter } from 'effect/unstable/http';
import { loadBotConfig } from './config.ts';
import { appLayer } from './router.ts';

const cfg = loadBotConfig();

if (!cfg.githubWebhookSecret) {
  metricsWarn('bot.webhook-secret-missing', {
    detail:
      'GITHUB_WEBHOOK_SECRET not set — webhook signature verification will reject all requests',
  });
}

const { handler, dispose } = HttpRouter.toWebHandler(appLayer, {
  disableLogger: true,
});

const server = Bun.serve({
  port: cfg.port,
  idleTimeout: 0,
  fetch: (request) => handler(request),
});

metricsInfo('bot.started', {
  port: server.port,
  dataDir: cfg.dataDir,
  llmProvider: cfg.llmProvider,
});

const shutdown = async (signal: string) => {
  metricsInfo('bot.shutdown', { signal });
  server.stop();
  await dispose();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
