// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { AzriRunOutput, HtmlBundle, RunMetadata } from '../../../types/src/index.ts';
import { ENGINE_VERSION, PROMPT_VERSION } from '../../../types/src/version.ts';
import { metricsError, metricsInfo, metricsWarn } from '../metrics.ts';
import type { ProviderName } from '../providers/registry.ts';
import type { Stage0Logger } from './types.ts';

export { runStage0 } from './stage-0-fetch-triage.ts';
export { runStage1 } from './stage-1-summarize.ts';
export { runStage5 } from './stage-5-validate.ts';

export const TOTAL_TIMEOUT_MS = 5 * 60 * 1000;
export const STAGE_TIMEOUTS_MS = {
  stage0: 10_000,
  stage1: 60_000,
  stage2: 90_000,
  stage3: 120_000,
  stage4: 10_000,
  stage5: 10_000,
  'stage-0': 10_000,
  'stage-1': 60_000,
  'stage-2': 90_000,
  'stage-3': 120_000,
  'stage-4': 10_000,
  'stage-5': 10_000,
} as const;

export interface OrchestratorCache {
  get(key: string): Promise<unknown | undefined>;
  set?(key: string, value: unknown): Promise<void>;
}

export interface OrchestratorDeps {
  provider?: ProviderName;
  logger?: Stage0Logger;
  cache?: OrchestratorCache;
  blobCacheGet?: (sha: string) => Promise<unknown>;
  blobCacheSet?: (sha: string, packet: unknown) => Promise<void>;
}

export const defaultLogger: Stage0Logger = {
  info: (event, fields) => metricsInfo(event, fields),
  warn: (event, fields) => metricsWarn(event, fields),
  debug: () => {},
};

export function defaultCache(): OrchestratorCache {
  return { get: async () => {}, set: async () => {} };
}

export function emptyMetadata(model: string, runId: string): RunMetadata {
  return {
    runId,
    engineVersion: ENGINE_VERSION,
    promptVersion: PROMPT_VERSION,
    model,
    durationMs: 0,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    cacheHit: false,
    stageDurations: {},
  };
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

export function getApiKeyEnv(provider: ProviderName): string {
  switch (provider) {
    case 'anthropic':
      return 'ANTHROPIC_API_KEY';
    case 'openai':
      return 'OPENAI_API_KEY';
    case 'google':
      return 'GOOGLE_API_KEY';
  }
}

export function providerFromEnv(deps: OrchestratorDeps): ProviderName {
  return (
    deps.provider ?? (process.env['AZRI_LLM_PROVIDER'] as ProviderName | undefined) ?? 'anthropic'
  );
}

export function failureOutput(
  message: string,
  stage: string,
  meta: RunMetadata,
  startMs: number,
): AzriRunOutput {
  meta.durationMs = Date.now() - startMs;
  metricsError('orchestrator.failed', { runId: meta.runId, stage, errorMessage: message });
  return {
    kind: 'failure',
    error: { message, stage },
    htmlBundle: makeFailureBundle(message),
    metadata: meta,
  };
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
}

function makeFailureBundle(message: string): HtmlBundle {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'"><title>Azri: generation failed</title></head><body><h1>Azri generation failed</h1><p>${escapeHtml(message)}</p></body></html>`;
  return { html, sizeBytes: Buffer.byteLength(html, 'utf8'), contentHash: 'failure' };
}
