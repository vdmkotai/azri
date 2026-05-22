// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { Effect } from 'effect';
import { HttpRouter } from 'effect/unstable/http';
import { healthzHandler } from './handlers/healthz.ts';
import { prWebhookHandler } from './handlers/pr-webhook.ts';
import { staticPageHandler } from './handlers/static-page.ts';

export const appLayer = HttpRouter.addAll([
  HttpRouter.route('GET', '/healthz', healthzHandler),
  HttpRouter.route('POST', '/webhooks/github', prWebhookHandler),
  HttpRouter.route(
    'GET',
    '/r/*',
    Effect.gen(function* () {
      const params = yield* HttpRouter.params;
      const relPath = params['*'] ?? '';
      return yield* staticPageHandler(relPath);
    }),
  ),
]);
