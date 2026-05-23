// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { generateObject } from 'ai';
import { z } from 'zod';

import type { AzriMode } from '../../../../types/src/index.ts';
import { computeCost } from '../../providers/pricing.ts';
import { getManifest, getSection } from '../../sections/registry.ts';
import type { PlannedSection, SectionManifestEntry } from '../../sections/types.ts';
import type { Stage0Logger, Stage2Deps } from '../types.ts';

const TIMEOUT_MS = 60_000;

const PlanResponseSchema = z.object({
  sections: z
    .array(
      z.object({
        id: z.string(),
        rationale: z.string(),
      }),
    )
    .min(1)
    .max(30),
});

export interface Stage2PlanTriage {
  readonly size: 'small' | 'medium' | 'large';
  readonly files: number;
  readonly lines: number;
  readonly languages: readonly string[];
  readonly tech: readonly string[];
  readonly recentCommits?: number;
  readonly hasUi: boolean;
  readonly hasApi: boolean;
  readonly hasDb: boolean;
}

export interface Stage2PlanInput {
  readonly mode: AzriMode;
  readonly triage: Stage2PlanTriage;
  readonly manifest?: readonly SectionManifestEntry[];
}

export interface Stage2PlanDetailedOutput {
  readonly sections: readonly PlannedSection[];
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly costUsd: number;
  readonly fellBackToMinimal: boolean;
}

function tokensFrom(result: unknown): { tokensIn: number; tokensOut: number } {
  const usage = (result as { usage?: { inputTokens?: number; outputTokens?: number } }).usage;
  return {
    tokensIn: usage?.inputTokens ?? 0,
    tokensOut: usage?.outputTokens ?? 0,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Stage 2 plan timeout')), ms);
    }),
  ]);
}

function buildPlanningPrompt(
  input: Stage2PlanInput,
  manifest: readonly SectionManifestEntry[],
): string {
  return `You are planning the structure of a project explainer page.

Mode: ${input.mode}
Input scale:
- Files: ${input.triage.files}
- Lines: ${input.triage.lines}
- Languages: ${input.triage.languages.join(', ') || '(none)'}
- Tech detected: ${input.triage.tech.join(', ') || '(none)'}
- Recent activity: ${input.triage.recentCommits ?? 0} commits last 30 days
- Has UI: ${input.triage.hasUi}
- Has API: ${input.triage.hasApi}
- Has DB: ${input.triage.hasDb}

Available section types (catalog):
${JSON.stringify(
  manifest.map((entry) => ({
    id: entry.id,
    name: entry.name,
    desc: entry.description,
    applicableFor: entry.applicableFor,
  })),
  null,
  2,
)}

Pick sections that fit. Bias TOWARD INCLUDING rather than skipping.
For LARGE inputs, include 15-25 sections.
For MEDIUM inputs, include 8-12 sections.
For SMALL inputs, include 3-5 sections.

Required: tldr first, key-files always (repo), pr-tldr always (PR).

Order narratively: what → how → why → next.

Output JSON: { "sections": [{ "id": "...", "rationale": "..." }, ...] }`;
}

function hasRegistered(id: string): boolean {
  try {
    getSection(id);
    return true;
  } catch {
    return false;
  }
}

function tldrLikeId(manifest: readonly SectionManifestEntry[]): string | undefined {
  return (
    manifest.find((entry) => entry.id === 'tldr')?.id ??
    manifest.find((entry) => entry.id.includes('tldr'))?.id
  );
}

function fallbackPlan(manifest: readonly SectionManifestEntry[]): PlannedSection[] {
  const id = tldrLikeId(manifest) ?? manifest[0]?.id;
  return id ? [{ id, rationale: 'Minimal fallback plan.', position: 0 }] : [];
}

function validateAndNormalize(
  rawSections: ReadonlyArray<{ id: string; rationale: string }>,
  input: Stage2PlanInput,
  manifest: readonly SectionManifestEntry[],
): PlannedSection[] {
  const allowed = new Set(manifest.map((entry) => entry.id));
  const byId = new Map<string, { id: string; rationale: string }>();
  for (const section of rawSections) {
    if (!allowed.has(section.id)) throw new Error(`Unknown planned section: ${section.id}`);
    if (!hasRegistered(section.id)) throw new Error(`Unregistered planned section: ${section.id}`);
    if (!byId.has(section.id)) byId.set(section.id, section);
  }

  const sections = Array.from(byId.values());
  const required: { id: string; rationale: string }[] = [];
  const tldr =
    input.mode === 'pr' && allowed.has('pr-tldr') && hasRegistered('pr-tldr')
      ? 'pr-tldr'
      : allowed.has('tldr') && hasRegistered('tldr')
        ? 'tldr'
        : undefined;
  if (tldr) required.push({ id: tldr, rationale: 'Required opening summary.' });
  if (input.mode === 'repo' && allowed.has('key-files') && hasRegistered('key-files')) {
    required.push({ id: 'key-files', rationale: 'Required repo navigation section.' });
  }

  const ordered = [
    ...required,
    ...sections.filter((section) => !required.some((req) => req.id === section.id)),
  ];

  if (ordered.length === 0) throw new Error('Empty plan');
  return ordered.map((section, position) => ({
    id: section.id,
    rationale: section.rationale,
    position,
  }));
}

export async function runStage2Plan(
  input: Stage2PlanInput,
  deps: Stage2Deps & { logger?: Stage0Logger },
): Promise<PlannedSection[]> {
  return [...(await runStage2PlanDetailed(input, deps)).sections];
}

export async function runStage2PlanDetailed(
  input: Stage2PlanInput,
  deps: Stage2Deps & { logger?: Stage0Logger },
): Promise<Stage2PlanDetailedOutput> {
  const manifest = input.manifest ?? getManifest(input.mode);
  const logger = deps.logger;
  if (manifest.length === 0) {
    return { sections: [], tokensIn: 0, tokensOut: 0, costUsd: 0, fellBackToMinimal: false };
  }

  try {
    const result = await withTimeout(
      generateObject({
        model: deps.reasoningModel,
        schema: PlanResponseSchema,
        system: 'Return only strict JSON matching the provided schema.',
        prompt: buildPlanningPrompt(input, manifest),
        providerOptions: {
          anthropic: { structuredOutputMode: 'jsonTool' },
        },
      }),
      TIMEOUT_MS,
    );
    const tokens = tokensFrom(result);
    const costUsd = computeCost(
      deps.provider,
      'reasoning',
      tokens.tokensIn,
      tokens.tokensOut,
      0,
    ).totalUsd;
    return {
      sections: validateAndNormalize(result.object.sections, input, manifest),
      tokensIn: tokens.tokensIn,
      tokensOut: tokens.tokensOut,
      costUsd,
      fellBackToMinimal: false,
    };
  } catch (error) {
    logger?.warn('stage2-plan.fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      sections: fallbackPlan(manifest),
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      fellBackToMinimal: true,
    };
  }
}
