// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { Cache, Duration, Effect } from 'effect';

import type { AzriRunOutput } from '@azri/types';

export type RunLookup = (cacheKey: string) => Effect.Effect<AzriRunOutput, Error>;

export const makeRunCache = (lookup: RunLookup) =>
  Cache.make({
    capacity: 200,
    timeToLive: Duration.hours(1),
    lookup,
  });

export type RunCache = Effect.Success<ReturnType<typeof makeRunCache>>;
