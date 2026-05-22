// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createHash } from 'node:crypto';

import { generateObject } from 'ai';
import { z } from 'zod';

import type {
  ChangedFile,
  EvidenceGraph,
  EvidencePacket,
  FileEntry,
} from '../../../types/src/index.ts';
import { STAGE_1_SUMMARIZE_PROMPT } from '../prompts/index.ts';
import { computeCost } from '../providers/pricing.ts';
import type { Stage0OkOutput, Stage1Deps, Stage1Output } from './types.ts';

const CONCURRENCY = 10;
const MAX_TIMEOUT_MS = 30_000;

// Zod schema for what we ask the LLM to return per file.
// Keep <=5 optional fields per object (defensive vs vercel/ai#11503).
const EvidencePacketLlmSchema = z.object({
  summary: z.string().describe('1-2 sentences describing what changed in this file and why'),
  symbols: z.array(z.string()).default([]).describe('Changed function/class/type names'),
  riskSignals: z.array(z.string()).default([]).describe('Risky patterns flagged in this change'),
  importance: z.number().min(0).max(1).describe('0..1 importance score'),
  citations: z
    .array(
      z.object({
        file: z.string(),
        lineStart: z.number().int().nonnegative(),
        lineEnd: z.number().int().nonnegative(),
        kind: z.enum(['code', 'comment', 'config', 'test']),
      }),
    )
    .default([]),
});

function blobShaFor(path: string, patch: string): string {
  return createHash('sha256').update(path).update('\0').update(patch).digest('hex').slice(0, 16);
}

function chunk<T>(arr: ReadonlyArray<T>, size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('LLM call timeout')), ms);
    }),
  ]);
}

interface PerFileInput {
  path: string;
  patchOrPreview: string;
  blobSha: string;
}

async function summarizeOneFile(
  input: PerFileInput,
  deps: Stage1Deps,
): Promise<{ packet: EvidencePacket; tokensIn: number; tokensOut: number; cached: boolean }> {
  if (deps.blobCacheGet) {
    const cached = await deps.blobCacheGet(input.blobSha);
    if (cached) {
      return { packet: cached as EvidencePacket, tokensIn: 0, tokensOut: 0, cached: true };
    }
  }

  try {
    const result = await withTimeout(
      generateObject({
        model: deps.cheapModel,
        schema: EvidencePacketLlmSchema,
        system: STAGE_1_SUMMARIZE_PROMPT,
        prompt: `File: ${input.path}\n\nDiff/preview:\n${input.patchOrPreview}`,
        // Lock jsonTool mode for Anthropic defensively (per vercel/ai#11503).
        providerOptions: {
          anthropic: { structuredOutputMode: 'jsonTool' },
        },
      }),
      MAX_TIMEOUT_MS,
    );

    const packet: EvidencePacket = {
      id: input.blobSha,
      path: input.path,
      symbols: result.object.symbols,
      summary: result.object.summary,
      riskSignals: result.object.riskSignals,
      importance: result.object.importance,
      citations: result.object.citations,
    };

    if (deps.blobCacheSet) {
      await deps.blobCacheSet(input.blobSha, packet).catch(() => {});
    }

    return {
      packet,
      tokensIn: result.usage.inputTokens ?? 0,
      tokensOut: result.usage.outputTokens ?? 0,
      cached: false,
    };
  } catch (e) {
    const packet: EvidencePacket = {
      id: input.blobSha,
      path: input.path,
      symbols: [],
      summary: 'Could not summarize this file.',
      riskSignals: [],
      importance: 0,
      citations: [],
      summarizeError: e instanceof Error ? e.message : String(e),
    };
    deps.logger.warn('stage1.file.failed', { path: input.path, error: packet.summarizeError });
    return { packet, tokensIn: 0, tokensOut: 0, cached: false };
  }
}

export async function runStage1(stage0: Stage0OkOutput, deps: Stage1Deps): Promise<Stage1Output> {
  const t0 = Date.now();
  deps.logger.info('stage1.start', {
    mode: stage0.mode,
    fileCount:
      stage0.mode === 'pr' ? stage0.filteredChangedFiles.length : stage0.interestingFiles.length,
  });

  const inputs: PerFileInput[] =
    stage0.mode === 'pr'
      ? stage0.filteredChangedFiles.map((f: ChangedFile) => ({
          path: f.path,
          patchOrPreview: f.patch,
          blobSha: blobShaFor(f.path, f.patch),
        }))
      : stage0.interestingFiles.map((f: FileEntry) => ({
          path: f.path,
          patchOrPreview: `(repo file, ${f.sizeBytes} bytes, ${f.lineCount} lines, last modified ${
            f.lastModifiedAt ?? 'unknown'
          })`,
          blobSha: blobShaFor(f.path, String(f.sizeBytes) + String(f.lastModifiedAt ?? '')),
        }));

  let tokensIn = 0;
  let tokensOut = 0;
  let cacheHits = 0;
  const packets: Record<string, EvidencePacket> = {};
  const lookupByFile: Record<string, string[]> = {};

  for (const batch of chunk(inputs, CONCURRENCY)) {
    const results = await Promise.all(batch.map((input) => summarizeOneFile(input, deps)));
    for (const result of results) {
      packets[result.packet.id] = result.packet;
      lookupByFile[result.packet.path] = [result.packet.id];
      tokensIn += result.tokensIn;
      tokensOut += result.tokensOut;
      if (result.cached) cacheHits++;
    }
  }

  const allCitations = Object.values(packets).flatMap((packet) => packet.citations);
  const graph: EvidenceGraph = { packets, citations: allCitations, lookupByFile };
  const costUsd = computeCost(deps.provider, 'cheap', tokensIn, tokensOut, 0).totalUsd;

  const durationMs = Date.now() - t0;
  deps.logger.info('stage1.end', {
    packets: Object.keys(packets).length,
    cacheHits,
    tokensIn,
    tokensOut,
    costUsd,
    durationMs,
  });

  return { evidenceGraph: graph, tokensIn, tokensOut, costUsd, cacheHits, durationMs };
}
