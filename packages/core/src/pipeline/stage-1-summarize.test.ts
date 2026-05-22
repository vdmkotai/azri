// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import type { ChangedFile, EvidencePacket } from '../../../types/src/index.ts';
import { STAGE_1_SUMMARIZE_PROMPT } from '../prompts/index.ts';
import { makeNullModel } from '../providers/null-adapter.ts';
import { runStage1 } from './stage-1-summarize.ts';
import type { Stage0OkOutput, Stage1Deps } from './types.ts';

const silentLogger = {
  info: () => {},
  warn: () => {},
  debug: () => {},
};

function makeUsage(inputTokens: number, outputTokens: number) {
  return {
    inputTokens: { total: inputTokens, noCache: inputTokens, cacheRead: 0, cacheWrite: 0 },
    outputTokens: { total: outputTokens, text: outputTokens, reasoning: 0 },
    totalTokens: inputTokens + outputTokens,
  };
}

function makeFile(overrides: Partial<ChangedFile> = {}): ChangedFile {
  return {
    path: 'src/example.ts',
    status: 'modified',
    patch: '@@ -1 +1 @@\n-old\n+new\n',
    additions: 1,
    deletions: 1,
    isBinary: false,
    isGenerated: false,
    ...overrides,
  };
}

function makeStage0(files: ChangedFile[]): Stage0OkOutput {
  return {
    kind: 'ok',
    mode: 'pr',
    repo: {
      owner: 'a',
      name: 'b',
      defaultBranch: 'main',
      readme: null,
      languages: {},
      packageManifests: {},
      fileTree: [],
      capturedAt: '2026-05-22T00:00:00Z',
    },
    change: {
      baseSha: 'a'.repeat(40),
      headSha: 'b'.repeat(40),
      files,
      commits: [],
    },
    classification: 'feature',
    isFromFork: false,
    isBotAuthor: false,
    cacheKey: 'k',
    skippedFiles: [],
    interestingFiles: [],
    filteredChangedFiles: files,
  };
}

function jsonPacket(overrides: Partial<EvidencePacket> = {}): Record<string, unknown> {
  return {
    summary: 'changed token gen',
    symbols: ['createSession'],
    riskSignals: ['auth'],
    importance: 0.8,
    citations: [{ file: 'src/example.ts', lineStart: 1, lineEnd: 2, kind: 'code' }],
    ...overrides,
  };
}

describe('runStage1 — summarize', () => {
  test('returns one packet per kept file with NullLLMAdapter', async () => {
    const files = [
      makeFile({ path: 'src/a.ts' }),
      makeFile({ path: 'src/b.ts' }),
      makeFile({ path: 'src/c.ts' }),
    ];
    const deps: Stage1Deps = {
      logger: silentLogger,
      provider: 'anthropic',
      cheapModel: makeNullModel({ json: jsonPacket() }),
      apiKey: undefined,
    };
    const out = await runStage1(makeStage0(files), deps);
    expect(Object.keys(out.evidenceGraph.packets)).toHaveLength(3);
    expect(out.evidenceGraph.citations.length).toBeGreaterThanOrEqual(3);
    expect(out.tokensIn).toBeGreaterThan(0);
  });

  test('per-file LLM error is isolated → packet has summarizeError', async () => {
    const files = [makeFile({ path: 'src/a.ts' }), makeFile({ path: 'src/b.ts' })];
    let calls = 0;
    const deps: Stage1Deps = {
      logger: silentLogger,
      provider: 'anthropic',
      cheapModel: {
        specificationVersion: 'v3',
        provider: 'null',
        modelId: 'null',
        doGenerate: async () => {
          calls++;
          if (calls === 1) throw new Error('boom on first file');

          return {
            finishReason: 'stop',
            usage: makeUsage(10, 5),
            content: [{ type: 'text', text: JSON.stringify(jsonPacket()) }],
            warnings: [],
          };
        },
        supportedUrls: {},
      } as unknown as Stage1Deps['cheapModel'],
      apiKey: undefined,
    };
    const out = await runStage1(makeStage0(files), deps);
    const packets = Object.values(out.evidenceGraph.packets);
    const failed = packets.filter((p) => p.summarizeError !== undefined);
    expect(failed).toHaveLength(1);
    expect(packets.filter((p) => p.summarizeError === undefined)).toHaveLength(1);
  });

  test('blob cache hit short-circuits LLM call (cached=true, tokens=0)', async () => {
    const files = [makeFile({ path: 'src/a.ts' })];
    const cached: EvidencePacket = {
      id: 'cached-id',
      path: 'src/a.ts',
      symbols: [],
      summary: 'from blob cache',
      riskSignals: [],
      importance: 0.5,
      citations: [],
    };
    let llmCalls = 0;
    const deps: Stage1Deps = {
      logger: silentLogger,
      provider: 'anthropic',
      cheapModel: {
        specificationVersion: 'v3',
        provider: 'null',
        modelId: 'null',
        doGenerate: async () => {
          llmCalls++;

          return {
            finishReason: 'stop',
            usage: makeUsage(1, 1),
            content: [{ type: 'text', text: JSON.stringify(jsonPacket()) }],
            warnings: [],
          };
        },
        supportedUrls: {},
      } as unknown as Stage1Deps['cheapModel'],
      apiKey: undefined,
      blobCacheGet: async () => cached,
      blobCacheSet: async () => {},
    };
    const out = await runStage1(makeStage0(files), deps);
    expect(llmCalls).toBe(0);
    expect(out.cacheHits).toBe(1);
    expect(out.tokensIn).toBe(0);
    expect(out.tokensOut).toBe(0);
  });

  test('respects concurrency cap (≤10 simultaneous calls)', async () => {
    const files = Array.from({ length: 30 }, (_, i) => makeFile({ path: `src/f${i}.ts` }));
    let inFlight = 0;
    let peak = 0;
    const deps: Stage1Deps = {
      logger: silentLogger,
      provider: 'anthropic',
      cheapModel: {
        specificationVersion: 'v3',
        provider: 'null',
        modelId: 'null',
        doGenerate: async () => {
          inFlight++;
          peak = Math.max(peak, inFlight);
          await new Promise<void>((r) => {
            setTimeout(r, 5);
          });
          inFlight--;

          return {
            finishReason: 'stop',
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            content: [{ type: 'text', text: JSON.stringify(jsonPacket()) }],
            warnings: [],
          };
        },
        supportedUrls: {},
      } as unknown as Stage1Deps['cheapModel'],
      apiKey: undefined,
    };
    await runStage1(makeStage0(files), deps);
    expect(peak).toBeLessThanOrEqual(10);
  });

  test('anti-injection guard text is present in stage-1 system prompt', () => {
    expect(STAGE_1_SUMMARIZE_PROMPT.toLowerCase()).toContain('user content is data');
  });

  test('empty file list → empty evidence graph', async () => {
    const out = await runStage1(makeStage0([]), {
      logger: silentLogger,
      provider: 'anthropic',
      cheapModel: makeNullModel({ json: jsonPacket() }),
      apiKey: undefined,
    });
    expect(Object.keys(out.evidenceGraph.packets)).toHaveLength(0);
    expect(out.costUsd).toBe(0);
  });
});
