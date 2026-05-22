// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { LanguageModel } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';

export interface NullModelOptions {
  text?: string;
  json?: unknown;
  throws?: Error;
  hangMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  provider?: string;
  modelId?: string;
}

function defaultText(opts: NullModelOptions): string {
  if (opts.text !== undefined) return opts.text;
  if (opts.json !== undefined) return JSON.stringify(opts.json);
  return 'mock response';
}

function makeUsage(inputTokens: number, outputTokens: number) {
  return {
    inputTokens: {
      total: inputTokens,
      noCache: inputTokens,
      cacheRead: 0,
      cacheWrite: 0,
    },
    outputTokens: { total: outputTokens, text: outputTokens, reasoning: 0 },
    totalTokens: inputTokens + outputTokens,
  };
}

/** Bridges ai/test MockLanguageModelV3 to LanguageModel (V2|V3 union). Test-only. */
export function makeNullModel(opts: NullModelOptions = {}): LanguageModel {
  const text = defaultText(opts);
  const inputTokens = opts.inputTokens ?? 100;
  const outputTokens = opts.outputTokens ?? 50;

  const mock = new MockLanguageModelV3({
    provider: opts.provider ?? 'null',
    modelId: opts.modelId ?? 'null-model',
    doGenerate: async () => {
      if (opts.throws) throw opts.throws;
      if (opts.hangMs) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, opts.hangMs);
        });
      }

      return {
        finishReason: 'stop',
        usage: makeUsage(inputTokens, outputTokens),
        content: [{ type: 'text', text }],
        warnings: [],
      };
    },
  });

  return mock as unknown as LanguageModel;
}

/** Sequenced responses for retry-path tests. */
export function makeSequencedNullModel(responses: NullModelOptions[]): LanguageModel {
  let callCount = 0;
  const mock = new MockLanguageModelV3({
    provider: 'null',
    modelId: 'null-sequenced',
    doGenerate: async () => {
      const opts = responses[callCount] ?? responses.at(-1);
      callCount++;
      if (!opts) throw new Error('No mock response configured');
      if (opts.throws) throw opts.throws;
      if (opts.hangMs) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, opts.hangMs);
        });
      }
      const inputTokens = opts.inputTokens ?? 100;
      const outputTokens = opts.outputTokens ?? 50;

      return {
        finishReason: 'stop',
        usage: makeUsage(inputTokens, outputTokens),
        content: [{ type: 'text', text: defaultText(opts) }],
        warnings: [],
      };
    },
  });

  return mock as unknown as LanguageModel;
}
