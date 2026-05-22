// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { Cache, Duration, Effect } from 'effect';

import type { AzriRunInput, EvidencePacket } from '@azri/types';
import { ENGINE_VERSION, PROMPT_VERSION } from '@azri/types';

import { computeCacheKey } from './compute-key.ts';

function input(): AzriRunInput {
  return {
    mode: 'pr',
    repo: {
      owner: 'acme',
      name: 'widgets',
      defaultBranch: 'main',
      readme: null,
      languages: {},
      packageManifests: {},
      fileTree: [],
      capturedAt: '2026-05-22T00:00:00Z',
    },
    change: { baseSha: 'a'.repeat(40), headSha: 'b'.repeat(40), files: [], commits: [] },
    config: { focusAreas: ['security'] },
  };
}

function packet(id: string): EvidencePacket {
  return {
    id,
    path: `${id}.ts`,
    symbols: [],
    summary: id,
    riskSignals: [],
    importance: 0,
    citations: [],
  };
}

describe('cache primitives', () => {
  test('LRU capacity boundary evicts least-recently-used lookup result', async () => {
    let lookups = 0;
    const cache = await Effect.runPromise(
      Cache.make({
        capacity: 2,
        timeToLive: Duration.minutes(1),
        lookup: (key: string) =>
          Effect.sync(() => {
            lookups++;
            return packet(key);
          }),
      }),
    );
    await Effect.runPromise(cache.lookup('a'));
    await Effect.runPromise(cache.lookup('b'));
    await Effect.runPromise(cache.lookup('c'));
    await Effect.runPromise(cache.lookup('a'));
    expect(lookups).toBe(4);
  });

  test('TTL expiry forces a new lookup after boundary passes', async () => {
    let lookups = 0;
    const cache = await Effect.runPromise(
      Cache.make({
        capacity: 10,
        timeToLive: Duration.millis(5),
        lookup: (key: string) =>
          Effect.sync(() => {
            lookups++;
            return packet(key);
          }),
      }),
    );
    await Effect.runPromise(cache.lookup('ttl'));
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 10);
    });
    await Effect.runPromise(cache.lookup('ttl'));
    expect(lookups).toBe(2);
  });

  test('computeCacheKey is deterministic and model-sensitive', () => {
    expect(computeCacheKey(input(), 'claude')).toBe(computeCacheKey(input(), 'claude'));
    expect(computeCacheKey(input(), 'claude')).not.toBe(computeCacheKey(input(), 'gpt'));
  });

  test('computeCacheKey changes when versioned key material changes', () => {
    const baseline = computeCacheKey(input(), 'claude');
    const changedHead = input();
    changedHead.change!.headSha = 'c'.repeat(40);
    expect(baseline).not.toBe(computeCacheKey(changedHead, 'claude'));
    expect(ENGINE_VERSION).toBeTruthy();
    expect(PROMPT_VERSION).toBeTruthy();
  });

  test.todo('schema-version mismatch returns miss once a versioned disk store exists');
  test.todo('disk store round-trips entries once the disk-backed cache API exists');
});
