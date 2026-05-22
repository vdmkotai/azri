// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { ENGINE_VERSION } from '@azri/types';
import { Effect } from 'effect';
import { HttpServerResponse } from 'effect/unstable/http';

const BOOT_AT = Date.now();

export const healthzHandler = Effect.gen(function* () {
  return yield* HttpServerResponse.json({
    status: 'ok',
    engineVersion: ENGINE_VERSION,
    uptimeMs: Date.now() - BOOT_AT,
  });
});
