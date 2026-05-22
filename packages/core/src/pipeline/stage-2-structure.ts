// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { generateObject } from 'ai';
import { z } from 'zod';

import type { ExplainerPlan, SectionType } from '../../../types/src/index.ts';
import { ExplainerPlanSchema } from '../../../types/src/schemas.ts';
import { STAGE_2_STRUCTURE_PROMPT } from '../prompts/index.ts';
import { computeCost } from '../providers/pricing.ts';
import type { Stage0OkOutput, Stage1Output, Stage2Deps, Stage2Output } from './types.ts';

const TIMEOUT_MS = 60_000;
const MAX_SECTIONS = 7;
const MIN_SECTIONS = 3;
const PR_SECTION_TYPES: ReadonlyArray<SectionType> = [
  'overview',
  'narrative',
  'annotated-diff',
  'module-map',
  'risk-callouts',
  'test-impact',
  'next-steps',
];
const REPO_SECTION_TYPES: ReadonlyArray<SectionType> = [
  'overview',
  'narrative',
  'module-map',
  'risk-callouts',
  'next-steps',
];

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Stage 2 timeout')), ms);
    }),
  ]);
}

function buildPlanSchema(allowedTypes: ReadonlyArray<SectionType>): z.ZodTypeAny {
  const sectionTypeEnum = z.enum(allowedTypes as [SectionType, ...SectionType[]]);
  const importanceEnum = z.enum(['critical', 'important', 'supporting', 'context']);

  return z.object({
    title: z.string(),
    summary: z.string(),
    sections: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          importance: importanceEnum,
          sectionType: sectionTypeEnum,
          files: z.array(z.string()).default([]),
          proseMarkdown: z.string().optional(),
          evidencePacketIds: z.array(z.string()).default([]),
          diagramId: z.string().optional(),
        }),
      )
      .min(MIN_SECTIONS)
      .max(MAX_SECTIONS),
    collapsedFiles: z.array(z.string()).default([]),
    diagramSpecs: z
      .array(
        z.object({
          id: z.string(),
          kind: z.enum(['mermaid-flow', 'mermaid-sequence', 'mermaid-er', 'mermaid-class']),
          mermaidSource: z.string(),
        }),
      )
      .max(1)
      .default([]),
    risks: z
      .array(
        z.object({
          severity: z.enum(['info', 'warn', 'critical']),
          category: z.enum([
            'auth',
            'schema-migration',
            'dependency-change',
            'api-contract',
            'performance',
            'secrets-exposure',
            'test-coverage',
          ]),
          summary: z.string(),
          citations: z
            .array(
              z.object({
                file: z.string(),
                lineStart: z.number().int().nonnegative(),
                lineEnd: z.number().int().nonnegative(),
                kind: z.enum(['code', 'comment', 'config', 'test']),
              }),
            )
            .default([]),
        }),
      )
      .default([]),
  });
}

function buildUserMessage(stage0: Stage0OkOutput, stage1: Stage1Output): string {
  const packetSummaries = Object.values(stage1.evidenceGraph.packets).map((packet) => ({
    id: packet.id,
    path: packet.path,
    importance: packet.importance,
    summary: packet.summary,
    symbols: packet.symbols,
    riskSignals: packet.riskSignals,
  }));
  const meta = stage0.change?.prMetadata;
  const intro =
    stage0.mode === 'pr' && meta
      ? `PR #${meta.number}: ${meta.title}\n${meta.body.slice(0, 1000)}\nClassification: ${stage0.classification}`
      : `Repo overview for ${stage0.repo.owner}/${stage0.repo.name}\nDefault branch: ${stage0.repo.defaultBranch}\nREADME excerpt:\n${(stage0.repo.readme ?? '').slice(0, 2000)}`;

  return `${intro}\n\nEvidence packets (${packetSummaries.length}):\n${JSON.stringify(packetSummaries, null, 2)}`;
}

function makeMinimalFallback(stage0: Stage0OkOutput): ExplainerPlan {
  return {
    schemaVersion: 1,
    title:
      stage0.mode === 'pr'
        ? (stage0.change?.prMetadata?.title ?? 'PR explainer (fallback)')
        : `${stage0.repo.owner}/${stage0.repo.name} (repo overview)`,
    summary: 'Automatic structuring failed; falling back to minimal plan.',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        importance: 'critical',
        sectionType: 'overview',
        files: [],
        evidencePacketIds: [],
      },
      {
        id: 'next-steps',
        title: 'Next steps',
        importance: 'important',
        sectionType: 'next-steps',
        files: [],
        evidencePacketIds: [],
      },
    ],
    collapsedFiles: [],
    diagramSpecs: [],
    risks: [],
  };
}

function validatePacketRefs(plan: ExplainerPlan, knownPacketIds: ReadonlySet<string>): boolean {
  for (const section of plan.sections) {
    for (const id of section.evidencePacketIds) {
      if (!knownPacketIds.has(id)) return false;
    }
  }

  return true;
}

export async function runStage2(
  stage0: Stage0OkOutput,
  stage1: Stage1Output,
  deps: Stage2Deps,
): Promise<Stage2Output> {
  const t0 = Date.now();
  const allowedTypes = stage0.mode === 'pr' ? PR_SECTION_TYPES : REPO_SECTION_TYPES;
  const schema = buildPlanSchema(allowedTypes);
  const userMessage = buildUserMessage(stage0, stage1);
  const knownPacketIds = new Set(Object.keys(stage1.evidenceGraph.packets));

  deps.logger.info('stage2.start', { mode: stage0.mode, packets: knownPacketIds.size });

  let tokensIn = 0;
  let tokensOut = 0;
  let retried = false;
  let fellBackToMinimal = false;

  async function attempt(extraGuidance = ''): Promise<ExplainerPlan> {
    const result = await withTimeout(
      generateObject({
        model: deps.reasoningModel,
        schema,
        system: STAGE_2_STRUCTURE_PROMPT + (extraGuidance ? `\n\n${extraGuidance}` : ''),
        prompt: userMessage,
        providerOptions: {
          anthropic: { structuredOutputMode: 'jsonTool' },
        },
      }),
      TIMEOUT_MS,
    );

    tokensIn += result.usage.inputTokens ?? 0;
    tokensOut += result.usage.outputTokens ?? 0;

    return ExplainerPlanSchema.parse({ schemaVersion: 1, ...result.object }) as ExplainerPlan;
  }

  let plan: ExplainerPlan;
  try {
    plan = await attempt();
    if (!validatePacketRefs(plan, knownPacketIds)) {
      throw new Error('Plan references unknown packet IDs');
    }
  } catch (e1) {
    deps.logger.warn('stage2.first-attempt-failed', {
      error: e1 instanceof Error ? e1.message : String(e1),
    });
    retried = true;

    try {
      plan = await attempt(
        'PREVIOUS ATTEMPT FAILED. Return a STRICT JSON object matching the schema exactly. ' +
          `Reference ONLY these evidencePacketIds: ${Array.from(knownPacketIds).join(', ')}`,
      );
      if (!validatePacketRefs(plan, knownPacketIds)) {
        throw new Error('Plan references unknown packet IDs (retry)', { cause: e1 });
      }
    } catch (e2) {
      deps.logger.warn('stage2.fellBackToMinimal', {
        error: e2 instanceof Error ? e2.message : String(e2),
      });
      plan = makeMinimalFallback(stage0);
      fellBackToMinimal = true;
    }
  }

  const costUsd = computeCost(deps.provider, 'reasoning', tokensIn, tokensOut, 0).totalUsd;
  const durationMs = Date.now() - t0;

  deps.logger.info('stage2.end', {
    sections: plan.sections.length,
    diagrams: plan.diagramSpecs.length,
    risks: plan.risks.length,
    retried,
    fellBackToMinimal,
    tokensIn,
    tokensOut,
    costUsd,
    durationMs,
  });

  return { plan, tokensIn, tokensOut, costUsd, retried, fellBackToMinimal, durationMs };
}
