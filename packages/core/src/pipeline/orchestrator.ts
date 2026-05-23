// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { randomUUID } from 'node:crypto';

import type {
  AzriRunInput,
  AzriRunOutput,
  EvidenceGraph,
  ExplainerPlan,
  HtmlBundle,
  RunMetadata,
} from '../../../types/src/index.ts';
import { PROVIDER_REGISTRY } from '../providers/registry.ts';
import * as stages from './stages.ts';

export type { OrchestratorDeps } from './stages.ts';

async function runStageWithTimeout<T>(
  label: string,
  ms: number,
  work: () => Promise<T>,
  meta: RunMetadata,
  startMs: number,
): Promise<{ ok: true; value: T } | { ok: false; output: AzriRunOutput }> {
  try {
    return { ok: true, value: await stages.withTimeout(work(), ms, label) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      output: stages.failureOutput(message, label.toLowerCase().replace(' ', '-'), meta, startMs),
    };
  }
}

function addUsage(
  meta: RunMetadata,
  usage: { tokensIn: number; tokensOut: number; costUsd: number },
): void {
  meta.tokensIn += usage.tokensIn;
  meta.tokensOut += usage.tokensOut;
  meta.costUsd += usage.costUsd;
}

async function runAzriInner(
  input: AzriRunInput,
  deps: stages.OrchestratorDeps,
): Promise<AzriRunOutput> {
  const startMs = Date.now();
  const runId = randomUUID();
  const logger = deps.logger ?? stages.defaultLogger;
  const provider = stages.providerFromEnv(deps);
  const cheapModel = PROVIDER_REGISTRY[provider]({ tier: 'cheap' });
  const reasoningModel = PROVIDER_REGISTRY[provider]({ tier: 'reasoning' });
  const modelName = (reasoningModel as { modelId?: string }).modelId ?? 'unknown';
  const metadata = stages.emptyMetadata(modelName, runId);
  const cache = deps.cache ?? stages.defaultCache();

  logger.info('orchestrator.start', { runId, provider, mode: input.mode });

  const stage0Started = Date.now();
  const stage0Result = await runStageWithTimeout(
    'stage-0',
    stages.STAGE_TIMEOUTS_MS.stage0,
    () => stages.runStage0(input, { cache, logger, model: modelName }),
    metadata,
    startMs,
  );
  if (!stage0Result.ok) return stage0Result.output;
  const stage0 = stage0Result.value;
  metadata.stageDurations['stage-0'] = Date.now() - stage0Started;

  if (stage0.kind === 'too-large') {
    metadata.durationMs = Date.now() - startMs;
    return {
      kind: 'too-large',
      stats: { files: stage0.stats.files, lines: stage0.stats.lines },
      metadata,
    };
  }
  if (stage0.kind === 'cache-hit') {
    metadata.durationMs = Date.now() - startMs;
    metadata.cacheHit = true;
    const cached = stage0.output as {
      htmlBundle: HtmlBundle;
      explainerPlan: ExplainerPlan;
      evidenceGraph: EvidenceGraph;
    };
    return { kind: 'cache-hit', ...cached, metadata };
  }
  if (stage0.kind === 'skip') {
    metadata.durationMs = Date.now() - startMs;
    return { kind: 'skip', reason: stage0.reason, metadata };
  }

  const stage1 = await runStage1(stage0, deps, logger, provider, cheapModel, metadata, startMs);
  if (!stage1.ok) return stage1.output;
  const stage2 = await runTimedStage(
    'stage-2',
    () =>
      stages.runStage2(stage0, stage1.value, { logger, provider, reasoningModel }, input.config),
    metadata,
    startMs,
  );
  if (!stage2.ok) return stage2.output;
  const stage3 = await runTimedStage(
    'stage-3',
    () =>
      stages.runStage3(
        {
          mode: stage0.mode,
          plan: stage2.value.plan,
          evidenceGraph: stage1.value.evidenceGraph,
          repo: stage0.repo,
          ...(stage0.change ? { change: stage0.change } : {}),
          config: input.config,
        },
        { logger, provider, reasoningModel },
      ),
    metadata,
    startMs,
  );
  if (!stage3.ok) return stage3.output;
  const stage4 = await runTimedStage(
    'stage-4',
    () =>
      stages.runStage4(stage3.value.plan, stage0.change, stage0.repo, {
        runMeta: metadata,
        generatedAt: new Date().toISOString(),
        ...(input.config.theme ? { theme: input.config.theme } : {}),
        ...(input.config.tokens ? { tokens: input.config.tokens } : {}),
      }),
    metadata,
    startMs,
  );
  if (!stage4.ok) return stage4.output;

  const stage5Started = Date.now();
  const stage5 = await runStage5(stage4.value.bundle, stage3.value.plan, stage0, logger);
  metadata.stageDurations['stage-5'] = Date.now() - stage5Started;
  metadata.durationMs = Date.now() - startMs;

  await cache
    .set?.(stage0.cacheKey, {
      htmlBundle: stage5.bundle,
      explainerPlan: stage3.value.plan,
      evidenceGraph: stage1.value.evidenceGraph,
      metadata,
    })
    .catch(() => {});

  logger.info('orchestrator.end', {
    runId,
    kind: 'ok',
    durationMs: metadata.durationMs,
    costUsd: metadata.costUsd,
    warnings: stage5.warnings.length,
  });

  return {
    kind: 'ok',
    htmlBundle: stage5.bundle,
    explainerPlan: stage3.value.plan,
    evidenceGraph: stage1.value.evidenceGraph,
    metadata,
  };
}

async function runTimedStage<T extends { tokensIn?: number; tokensOut?: number; costUsd?: number }>(
  label: keyof typeof stages.STAGE_TIMEOUTS_MS,
  work: () => Promise<T>,
  metadata: RunMetadata,
  startMs: number,
): Promise<{ ok: true; value: T } | { ok: false; output: AzriRunOutput }> {
  const started = Date.now();
  const result = await runStageWithTimeout(
    label,
    stages.STAGE_TIMEOUTS_MS[label],
    work,
    metadata,
    startMs,
  );
  if (!result.ok) return result;
  metadata.stageDurations[label] = Date.now() - started;
  if (result.value.tokensIn !== undefined) addUsage(metadata, result.value as Required<T>);
  return result;
}

async function runStage1(
  stage0: Awaited<ReturnType<typeof stages.runStage0>> & { kind: 'ok' },
  deps: stages.OrchestratorDeps,
  logger: NonNullable<stages.OrchestratorDeps['logger']>,
  provider: ReturnType<typeof stages.providerFromEnv>,
  cheapModel: Parameters<typeof stages.runStage1>[1]['cheapModel'],
  metadata: RunMetadata,
  startMs: number,
): Promise<
  | { ok: true; value: Awaited<ReturnType<typeof stages.runStage1>> }
  | { ok: false; output: AzriRunOutput }
> {
  return runTimedStage(
    'stage-1',
    () =>
      stages.runStage1(stage0, {
        logger,
        provider,
        cheapModel,
        apiKey: process.env[stages.getApiKeyEnv(provider)],
        ...(deps.blobCacheGet ? { blobCacheGet: deps.blobCacheGet } : {}),
        ...(deps.blobCacheSet ? { blobCacheSet: deps.blobCacheSet } : {}),
      }),
    metadata,
    startMs,
  );
}

async function runStage5(
  bundle: HtmlBundle,
  plan: ExplainerPlan,
  stage0: Awaited<ReturnType<typeof stages.runStage0>> & { kind: 'ok' },
  logger: NonNullable<stages.OrchestratorDeps['logger']>,
): Promise<Awaited<ReturnType<typeof stages.runStage5>>> {
  try {
    return await stages.withTimeout(
      stages.runStage5(
        bundle,
        plan,
        {
          mode: stage0.mode,
          ...(stage0.change ? { change: stage0.change } : {}),
          repo: stage0.repo,
        },
        { logger },
      ),
      stages.STAGE_TIMEOUTS_MS.stage5,
      'stage-5',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('orchestrator.stage5.failed', { message });
    return {
      bundle,
      warnings: [`Stage 5 validation skipped: ${message}`],
      citationsValid: 0,
      citationsHallucinated: 0,
      durationMs: 0,
    };
  }
}

export async function runAzri(
  input: AzriRunInput,
  deps: stages.OrchestratorDeps = {},
): Promise<AzriRunOutput> {
  const startMs = Date.now();
  const reasoningModel = PROVIDER_REGISTRY[stages.providerFromEnv(deps)]({ tier: 'reasoning' });
  const modelName = (reasoningModel as { modelId?: string }).modelId ?? 'unknown';
  const metadata = stages.emptyMetadata(modelName, randomUUID());

  try {
    return await stages.withTimeout(runAzriInner(input, deps), stages.TOTAL_TIMEOUT_MS, 'Azri run');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return stages.failureOutput(message, 'total', metadata, startMs);
  }
}
