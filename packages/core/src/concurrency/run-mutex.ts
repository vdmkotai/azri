// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { Effect, PartitionedSemaphore } from 'effect';

export const keyFor = (owner: string, repo: string, prNumber: number) =>
  `${owner}/${repo}#${prNumber}`;

export interface RunMutex {
  withLock<A, E, R>(key: string, work: Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
}

class PartitionedRunMutex implements RunMutex {
  constructor(private readonly mutex: PartitionedSemaphore.PartitionedSemaphore<string>) {}

  withLock<A, E, R>(key: string, work: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> {
    return this.mutex.withPermit(key)(work);
  }
}

export const makeRunMutex = () =>
  new PartitionedRunMutex(PartitionedSemaphore.makeUnsafe<string>({ permits: 1 }));

export type RunMutexImpl = PartitionedRunMutex;
