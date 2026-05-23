// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { generateObject } from 'ai';
import { z } from 'zod';

import { resolveV3Theme } from '../../../../renderer/src/design-system/presets-v3/index.ts';
import { metricsWarn } from '../../metrics.ts';
import { computeCost } from '../../providers/pricing.ts';
import type { ProviderName } from '../../providers/registry.ts';
import { getSection } from '../../sections/registry.ts';
import type { PlannedSection, ProducedSection, SectionInput } from '../../sections/types.ts';
import type { Stage0Logger } from '../types.ts';

const CONCURRENCY = 6;
const TIMEOUT_MS = 45_000;

export interface PipelineDeps {
  readonly provider: ProviderName;
  readonly reasoningModel: Parameters<typeof generateObject>[0]['model'];
  readonly logger?: Stage0Logger;
}

export interface FailedSection {
  readonly id: string;
  readonly error: string;
}

interface SectionAttempt {
  readonly section: ProducedSection | null;
  readonly failure?: FailedSection;
  readonly tokensIn: number;
  readonly tokensOut: number;
}

export interface Stage3ProduceDetailedOutput {
  readonly produced: readonly ProducedSection[];
  readonly failed: readonly FailedSection[];
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly costUsd: number;
}

function tokensFrom(result: unknown): { tokensIn: number; tokensOut: number } {
  const usage = (result as { usage?: { inputTokens?: number; outputTokens?: number } }).usage;
  return {
    tokensIn: usage?.inputTokens ?? 0,
    tokensOut: usage?.outputTokens ?? 0,
  };
}

async function withConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Stage 3 produce timeout')), ms);
    }),
  ]);
}

function prettyZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

async function callSectionLlm(
  prompt: string,
  deps: PipelineDeps,
): Promise<{ object: unknown; tokensIn: number; tokensOut: number }> {
  const result = await withTimeout(
    generateObject({
      model: deps.reasoningModel,
      schema: z.unknown(),
      system: 'Return ONLY valid JSON. No prose.',
      prompt,
      providerOptions: {
        anthropic: { structuredOutputMode: 'jsonTool' },
      },
    }),
    TIMEOUT_MS,
  );
  return { object: result.object, ...tokensFrom(result) };
}

async function produceOne(
  planned: PlannedSection,
  input: SectionInput,
  deps: PipelineDeps,
): Promise<SectionAttempt> {
  let tokensIn = 0;
  let tokensOut = 0;
  try {
    const section = getSection(planned.id);
    const themeTokens = resolveV3Theme(input.config.theme);
    const prompt = section.prompt(input, themeTokens);
    const first = await callSectionLlm(prompt, deps);
    tokensIn += first.tokensIn;
    tokensOut += first.tokensOut;
    const parsed = section.schema.safeParse(first.object);
    if (parsed.success) {
      return {
        section: { id: planned.id, rationale: planned.rationale, data: parsed.data },
        tokensIn,
        tokensOut,
      };
    }

    const retryPrompt = `${prompt}\n\nYour previous output failed validation: ${prettyZodError(parsed.error)}. Re-emit ONLY valid JSON matching the schema.`;
    const second = await callSectionLlm(retryPrompt, deps);
    tokensIn += second.tokensIn;
    tokensOut += second.tokensOut;
    const retried = section.schema.safeParse(second.object);
    if (retried.success) {
      return {
        section: { id: planned.id, rationale: planned.rationale, data: retried.data },
        tokensIn,
        tokensOut,
      };
    }

    const message = prettyZodError(retried.error);
    deps.logger?.warn('stage3-produce.section.validation-failed', {
      sectionId: planned.id,
      error: message,
    });
    if (!deps.logger)
      metricsWarn('stage3-produce.section.validation-failed', {
        sectionId: planned.id,
        error: message,
      });
    return { section: null, failure: { id: planned.id, error: message }, tokensIn, tokensOut };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    deps.logger?.warn('stage3-produce.section.failed', { sectionId: planned.id, error: message });
    if (!deps.logger)
      metricsWarn('stage3-produce.section.failed', { sectionId: planned.id, error: message });
    return { section: null, failure: { id: planned.id, error: message }, tokensIn, tokensOut };
  }
}

export async function runStage3Produce(
  planned: readonly PlannedSection[],
  input: SectionInput,
  deps: PipelineDeps,
): Promise<ProducedSection[]> {
  return [...(await runStage3ProduceDetailed(planned, input, deps)).produced];
}

export async function runStage3ProduceDetailed(
  planned: readonly PlannedSection[],
  input: SectionInput,
  deps: PipelineDeps,
): Promise<Stage3ProduceDetailedOutput> {
  const results = await withConcurrency(planned, CONCURRENCY, (section) =>
    produceOne(section, input, deps),
  );
  const tokensIn = results.reduce((sum, result) => sum + result.tokensIn, 0);
  const tokensOut = results.reduce((sum, result) => sum + result.tokensOut, 0);
  const costUsd = computeCost(deps.provider, 'reasoning', tokensIn, tokensOut, 0).totalUsd;
  return {
    produced: results
      .map((result) => result.section)
      .filter((section): section is ProducedSection => section !== null),
    failed: results
      .map((result) => result.failure)
      .filter((failure): failure is FailedSection => failure !== undefined),
    tokensIn,
    tokensOut,
    costUsd,
  };
}
