// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import {
  resolveVerbosity,
  computeCost,
  type ProviderName,
} from '../../../packages/core/src/index.ts';
import type { AzriRunInput, Verbosity } from '../../../packages/types/src/index.ts';
import { VERBOSITY_CONFIG } from '../../../packages/types/src/index.ts';

export interface PerStageEstimate {
  stage: string;
  tier: 'cheap' | 'reasoning';
  inputTokens: number;
  outputTokens: number;
  usd: number;
}

export interface CostEstimate {
  provider: ProviderName;
  verbosity: Verbosity;
  totalInputTokens: number;
  totalOutputTokens: number;
  usd: number;
  perStage: ReadonlyArray<PerStageEstimate>;
  /** Approximate; assumes warm prompt cache (60-70% reduction on Anthropic). */
  withCacheUsd: number;
  notes: ReadonlyArray<string>;
}

const STAGE1_INPUT_PER_FILE = 400;
const STAGE1_OUTPUT_PER_FILE = 200;
const STAGE2_INPUT_FIXED = 4000;
const STAGE2_OUTPUT_FIXED = 1500;
const STAGE3_INPUT_PER_SECTION = 2000;
const STAGE3_OUTPUT_PER_SECTION = 400;

function sectionsForVerbosity(verb: Verbosity): number {
  const [min, max] = VERBOSITY_CONFIG[verb].sections;
  return Math.round((min + max) / 2);
}

export function estimateCost(input: AzriRunInput, provider: ProviderName): CostEstimate {
  let fileCount = 0;

  if (input.mode === 'pr' && input.change) {
    fileCount = input.change.files.filter((file) => !file.isGenerated && !file.isBinary).length;
  } else if (input.mode === 'repo') {
    fileCount = Math.min(input.repo.fileTree.length, 30);
  }

  const verbosity = resolveVerbosity(input.config);
  const wordMult = VERBOSITY_CONFIG[verbosity].wordMult;
  const sections = sectionsForVerbosity(verbosity);

  const notes: string[] =
    input.mode === 'repo' ? [`Repo mode: estimating top ${fileCount} files`] : [];

  const stage1In = fileCount * STAGE1_INPUT_PER_FILE;
  const stage1Out = fileCount * STAGE1_OUTPUT_PER_FILE;
  const stage2In = STAGE2_INPUT_FIXED;
  const stage2Out = STAGE2_OUTPUT_FIXED;
  const stage3In = sections * STAGE3_INPUT_PER_SECTION;
  const stage3OutBase = sections * STAGE3_OUTPUT_PER_SECTION;
  const stage3Out = Math.round(stage3OutBase * wordMult);

  const perStage: PerStageEstimate[] = [
    {
      stage: 'Stage 1 (file summarize)',
      tier: 'cheap',
      inputTokens: stage1In,
      outputTokens: stage1Out,
      usd: computeCost(provider, 'cheap', stage1In, stage1Out, 0).totalUsd,
    },
    {
      stage: 'Stage 2 (structure extract)',
      tier: 'reasoning',
      inputTokens: stage2In,
      outputTokens: stage2Out,
      usd: computeCost(provider, 'reasoning', stage2In, stage2Out, 0).totalUsd,
    },
    {
      stage: `Stage 3 (sections × ${sections})`,
      tier: 'reasoning',
      inputTokens: stage3In,
      outputTokens: stage3Out,
      usd: computeCost(provider, 'reasoning', stage3In, stage3Out, 0).totalUsd,
    },
  ];

  const totalInputTokens = stage1In + stage2In + stage3In;
  const totalOutputTokens = stage1Out + stage2Out + stage3Out;
  const usd = perStage.reduce((sum, stage) => sum + stage.usd, 0);

  const cacheFactor = provider === 'anthropic' ? 0.6 : 0.5;
  const cachedInputs = Math.round(totalInputTokens * cacheFactor);
  const uncachedInputs = totalInputTokens - cachedInputs;
  const withCacheUsd =
    computeCost(provider, 'reasoning', uncachedInputs, totalOutputTokens, cachedInputs).totalUsd *
    0.7;

  return {
    provider,
    verbosity,
    totalInputTokens,
    totalOutputTokens,
    usd: Math.round(usd * 10000) / 10000,
    perStage,
    withCacheUsd: Math.round(withCacheUsd * 10000) / 10000,
    notes,
  };
}

export function formatCostEstimate(est: CostEstimate): string {
  const estimatedColdCost = `$${est.usd.toFixed(4)} (cold cache)`;
  const estimatedWarmCost = `~$${est.withCacheUsd.toFixed(4)} (warm cache)`;
  const estimatedCost = `${estimatedColdCost} / ${estimatedWarmCost}`;
  const mult = VERBOSITY_CONFIG[est.verbosity].wordMult;
  const multLabel = mult === 1.0 ? '1x' : mult === 0.5 ? '0.5x' : `${mult}x`;
  const lines: string[] = [
    `Provider: ${est.provider}`,
    `Verbosity: ${est.verbosity} (≈${multLabel} cost)`,
    `Estimated cost: ${estimatedCost}`,
    `Total tokens: ${est.totalInputTokens} in / ${est.totalOutputTokens} out`,
    '',
  ];

  for (const stage of est.perStage) {
    lines.push(
      `  ${stage.stage} [${stage.tier}]: $${stage.usd.toFixed(4)} (${stage.inputTokens} in / ${stage.outputTokens} out)`,
    );
  }

  if (est.notes.length > 0) {
    lines.push('');
    for (const note of est.notes) lines.push(`Note: ${note}`);
  }

  return lines.join('\n');
}
