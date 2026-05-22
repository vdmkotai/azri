// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { Config, Effect, Layer } from 'effect';
import { getAuthStatus } from '../providers/auth.ts';
import { PROVIDER_REGISTRY, type ProviderName } from '../providers/registry.ts';
import { LlmService } from './services.ts';

function isProvider(s: string): s is ProviderName {
  return s === 'anthropic' || s === 'openai' || s === 'google';
}

export const LlmServiceLive = Layer.effect(
  LlmService,
  Effect.gen(function* () {
    const raw = yield* Config.string('AZRI_LLM_PROVIDER').pipe(Config.withDefault('anthropic'));
    const provider: ProviderName = isProvider(raw) ? raw : 'anthropic';
    const auth = getAuthStatus(provider);
    if (!auth.hasKey) {
      yield* Effect.logWarning(`LlmService: ${auth.envVar} is not set; calls will fail`);
    }
    return {
      provider,
      getModel: (tier = 'reasoning', modelOverride) =>
        PROVIDER_REGISTRY[provider]({ tier, ...(modelOverride ? { model: modelOverride } : {}) }),
    };
  }),
);
