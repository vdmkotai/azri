// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createHash, randomUUID } from 'node:crypto';

import { renderPageV3, renderSectionV3Bytes } from '../../../../renderer/src/v3/render.ts';
import type {
  AzriRunInput,
  AzriRunOutput,
  EvidenceGraph,
  ExplainerPlan,
  HtmlBundle,
  RunMetadata,
} from '../../../../types/src/index.ts';
import { PROVIDER_REGISTRY } from '../../providers/registry.ts';
import type { ProducedSection } from '../../sections/types.ts';
import * as stages from '../stages.ts';
import type { Stage0OkOutput, Stage1Output } from '../types.ts';
import { runStage2PlanDetailed, type Stage2PlanTriage } from './stage-2-plan.ts';
import { runStage3ProduceDetailed } from './stage-3-produce.ts';

function addDuration(meta: RunMetadata, label: string, started: number): void {
  meta.stageDurations[label] = Date.now() - started;
}

function htmlBundle(html: string): HtmlBundle {
  return {
    html,
    sizeBytes: Buffer.byteLength(html, 'utf8'),
    contentHash: createHash('sha256').update(html).digest('hex'),
  };
}

function inferTech(stage0: Stage0OkOutput): string[] {
  const manifests = Object.entries(stage0.repo.packageManifests)
    .map(([path, content]) => `${path}: ${content.slice(0, 300)}`)
    .join('\n');
  const tech = new Set<string>();
  if (/react|next/iu.test(manifests)) tech.add('React');
  if (/bun/iu.test(manifests)) tech.add('Bun');
  if (/effect/iu.test(manifests)) tech.add('Effect');
  if (/zod/iu.test(manifests)) tech.add('Zod');
  if (/tailwind/iu.test(manifests)) tech.add('Tailwind');
  return Array.from(tech);
}

function triageFrom(stage0: Stage0OkOutput): Stage2PlanTriage {
  const files =
    stage0.mode === 'pr' ? stage0.filteredChangedFiles.length : stage0.interestingFiles.length;
  const lines =
    stage0.mode === 'pr'
      ? stage0.filteredChangedFiles.reduce((sum, file) => sum + file.additions + file.deletions, 0)
      : stage0.interestingFiles.reduce((sum, file) => sum + file.lineCount, 0);
  const size =
    files > 40 || lines > 1500 ? 'large' : files > 10 || lines > 300 ? 'medium' : 'small';
  const paths = [
    ...stage0.filteredChangedFiles.map((file) => file.path),
    ...stage0.interestingFiles.map((file) => file.path),
    ...stage0.repo.fileTree.map((file) => file.path).slice(0, 200),
  ];

  return {
    size,
    files,
    lines,
    languages: Object.keys(stage0.repo.languages),
    tech: inferTech(stage0),
    recentCommits: stage0.change?.commits.length ?? 0,
    hasUi: paths.some((path) => /\.(tsx|jsx|vue|svelte)$/u.test(path) || path.includes('/app/')),
    hasApi: paths.some((path) => /api|route|controller|server/iu.test(path)),
    hasDb: paths.some((path) => /schema|migration|prisma|database|db/iu.test(path)),
  };
}

function legacyPlan(produced: readonly ProducedSection[], title: string): ExplainerPlan {
  return {
    schemaVersion: 1,
    title,
    summary: produced[0]?.rationale ?? 'Azri v3 dynamic section plan.',
    sections: produced.map((section, index) => ({
      id: section.id,
      title: section.id,
      importance: index === 0 ? 'critical' : 'important',
      sectionType: 'overview',
      files: [],
      proseMarkdown: JSON.stringify(section.data),
      evidencePacketIds: [],
    })),
    collapsedFiles: [],
    diagramSpecs: [],
    risks: [],
  };
}

export async function runAzriV3(
  input: AzriRunInput,
  deps: stages.OrchestratorDeps = {},
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

  try {
    const stage0Started = Date.now();
    const stage0 = await stages.withTimeout(
      stages.runStage0(input, { cache, logger, model: modelName }),
      stages.STAGE_TIMEOUTS_MS.stage0,
      'stage-0',
    );
    addDuration(metadata, 'stage-0', stage0Started);

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

    const stage1Started = Date.now();
    const stage1: Stage1Output = await stages.withTimeout(
      stages.runStage1(stage0, {
        logger,
        provider,
        cheapModel,
        apiKey: process.env[stages.getApiKeyEnv(provider)],
        ...(deps.blobCacheGet ? { blobCacheGet: deps.blobCacheGet } : {}),
        ...(deps.blobCacheSet ? { blobCacheSet: deps.blobCacheSet } : {}),
      }),
      stages.STAGE_TIMEOUTS_MS.stage1,
      'stage-1',
    );
    addDuration(metadata, 'stage-1', stage1Started);
    metadata.tokensIn += stage1.tokensIn;
    metadata.tokensOut += stage1.tokensOut;
    metadata.costUsd += stage1.costUsd;

    const stage2Started = Date.now();
    const planResult = await stages.withTimeout(
      runStage2PlanDetailed(
        { mode: stage0.mode, triage: triageFrom(stage0) },
        { logger, provider, reasoningModel },
      ),
      stages.STAGE_TIMEOUTS_MS.stage2,
      'stage-2',
    );
    addDuration(metadata, 'stage-2', stage2Started);
    metadata.tokensIn += planResult.tokensIn;
    metadata.tokensOut += planResult.tokensOut;
    metadata.costUsd += planResult.costUsd;

    const stage3Started = Date.now();
    const produceResult = await stages.withTimeout(
      runStage3ProduceDetailed(
        planResult.sections,
        {
          mode: stage0.mode,
          repo: stage0.repo,
          evidenceGraph: stage1.evidenceGraph,
          config: input.config,
          ...(stage0.change ? { change: stage0.change } : {}),
        },
        { logger, provider, reasoningModel },
      ),
      stages.STAGE_TIMEOUTS_MS.stage3,
      'stage-3',
    );
    const produced = produceResult.produced;
    addDuration(metadata, 'stage-3', stage3Started);
    metadata.tokensIn += produceResult.tokensIn;
    metadata.tokensOut += produceResult.tokensOut;
    metadata.costUsd += produceResult.costUsd;

    const title =
      stage0.mode === 'pr'
        ? (stage0.change?.prMetadata?.title ?? 'PR explainer')
        : `${stage0.repo.owner}/${stage0.repo.name}`;
    const stage4Started = Date.now();
    const rendered = renderPageV3({
      title,
      themeName: input.config.theme ?? 'default',
      sections: produced,
      metadata: {
        generatedAt: new Date().toISOString(),
        runId,
        repoUrl: `https://github.com/${stage0.repo.owner}/${stage0.repo.name}`,
        ...(stage0.change?.prMetadata
          ? {
              prUrl: `https://github.com/${stage0.repo.owner}/${stage0.repo.name}/pull/${stage0.change.prMetadata.number}`,
            }
          : {}),
      },
    });
    const bundle = htmlBundle(rendered);
    addDuration(metadata, 'stage-4', stage4Started);

    const plan = legacyPlan(produced, title);
    const stage5Started = Date.now();
    const stage5 = await stages.runStage5(
      bundle,
      plan,
      { mode: stage0.mode, repo: stage0.repo, ...(stage0.change ? { change: stage0.change } : {}) },
      { logger },
    );
    addDuration(metadata, 'stage-5', stage5Started);
    metadata.durationMs = Date.now() - startMs;

    await cache
      .set?.(stage0.cacheKey, {
        htmlBundle: stage5.bundle,
        explainerPlan: plan,
        evidenceGraph: stage1.evidenceGraph,
        metadata,
      })
      .catch(() => {});

    return {
      kind: 'ok',
      htmlBundle: stage5.bundle,
      explainerPlan: plan,
      evidenceGraph: stage1.evidenceGraph,
      metadata,
      plannedSections: planResult.sections,
      producedSections: produced.map((section) => ({
        id: section.id,
        rationale: section.rationale,
        htmlBytes: renderSectionV3Bytes(section, input.config.theme),
      })),
      failedSections: produceResult.failed,
      cost: {
        tokensIn: metadata.tokensIn,
        tokensOut: metadata.tokensOut,
        usd: metadata.costUsd,
      },
    } as AzriRunOutput;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return stages.failureOutput(message, 'v3', metadata, startMs);
  }
}
