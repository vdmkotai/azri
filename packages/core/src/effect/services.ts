// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { LanguageModel } from 'ai';
import { Context, Effect } from 'effect';
import type { ProviderName, Tier } from '../providers/registry.ts';
import { LlmProviderError } from './errors.ts';

export interface LlmServiceShape {
  readonly provider: ProviderName;
  readonly getModel: (tier?: Tier, modelOverride?: string) => LanguageModel;
}

export class LlmService extends Context.Service<LlmService, LlmServiceShape>()(
  'azri/effect/LlmService',
) {}

export const wrapLlmProviderCall = <A>(work: () => Promise<A>) =>
  Effect.tryPromise({
    try: work,
    catch: (cause) => new LlmProviderError({ cause }),
  });
