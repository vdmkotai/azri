// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export type ProviderName = 'anthropic' | 'openai' | 'google';

export type Tier = 'cheap' | 'reasoning';

export interface ProviderConfig {
  model?: string;
  tier?: Tier;
}

export type ProviderFactory = (cfg: ProviderConfig) => LanguageModel;

/**
 * Default model selection per provider per tier.
 * Cheap = per-file summarization (Stage 1). Reasoning = structure + sections (Stages 2-3).
 */
export const DEFAULT_MODELS: Record<ProviderName, Record<Tier, string>> = {
  anthropic: { cheap: 'claude-haiku-4-5', reasoning: 'claude-sonnet-4-5' },
  openai: { cheap: 'gpt-4o-mini', reasoning: 'gpt-4o' },
  google: { cheap: 'gemini-2.0-flash', reasoning: 'gemini-2.0-pro-exp' },
};

/**
 * Provider registry — one factory per provider.
 * Adding a 4th provider (e.g., OpenRouter) = one entry in this map.
 */
export const PROVIDER_REGISTRY: Record<ProviderName, ProviderFactory> = {
  anthropic: (cfg) => anthropic(cfg.model ?? DEFAULT_MODELS.anthropic[cfg.tier ?? 'reasoning']),
  openai: (cfg) => openai(cfg.model ?? DEFAULT_MODELS.openai[cfg.tier ?? 'reasoning']),
  google: (cfg) => google(cfg.model ?? DEFAULT_MODELS.google[cfg.tier ?? 'reasoning']),
};

export function getProvider(name: ProviderName, cfg: ProviderConfig = {}): LanguageModel {
  const factory = PROVIDER_REGISTRY[name];
  if (!factory) throw new Error(`Unknown provider: ${name}`);
  return factory(cfg);
}
