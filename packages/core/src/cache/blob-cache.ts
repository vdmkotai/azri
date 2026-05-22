// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { Cache, Duration, Effect } from 'effect';

import type { EvidencePacket } from '@azri/types';

export type BlobLookup = (blobSha: string) => Effect.Effect<EvidencePacket, Error>;

export const makeBlobCache = (lookup: BlobLookup) =>
  Cache.make({
    capacity: 1000,
    timeToLive: Duration.hours(24),
    lookup,
  });

export type BlobCache = Effect.Success<ReturnType<typeof makeBlobCache>>;
