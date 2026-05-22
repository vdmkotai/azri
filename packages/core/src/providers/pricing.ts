// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { ProviderName, Tier } from './registry.ts';

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion?: number;
}

export interface CostEstimate {
  provider: ProviderName;
  tier: Tier;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  inputUsd: number;
  outputUsd: number;
  totalUsd: number;
}

/** USD per 1M tokens, aligned to published provider rates available in late 2025. */
export const PRICING: Record<ProviderName, Record<Tier, ModelPricing>> = {
  anthropic: {
    cheap: { inputPerMillion: 1.0, outputPerMillion: 5.0, cachedInputPerMillion: 0.1 },
    reasoning: { inputPerMillion: 3.0, outputPerMillion: 15.0, cachedInputPerMillion: 0.3 },
  },
  openai: {
    cheap: { inputPerMillion: 0.15, outputPerMillion: 0.6 },
    reasoning: { inputPerMillion: 5.0, outputPerMillion: 15.0 },
  },
  google: {
    cheap: { inputPerMillion: 0.075, outputPerMillion: 0.3 },
    reasoning: { inputPerMillion: 1.25, outputPerMillion: 5.0 },
  },
};

export function computeCost(
  provider: ProviderName,
  tier: Tier,
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens = 0,
): CostEstimate {
  const pricing = PRICING[provider][tier];
  const billableInputTokens = Math.max(0, inputTokens - cachedInputTokens);
  const inputUsd =
    (billableInputTokens / 1_000_000) * pricing.inputPerMillion +
    (cachedInputTokens / 1_000_000) * (pricing.cachedInputPerMillion ?? pricing.inputPerMillion);
  const outputUsd = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  return {
    provider,
    tier,
    inputTokens,
    outputTokens,
    cachedInputTokens,
    inputUsd,
    outputUsd,
    totalUsd: inputUsd + outputUsd,
  };
}
