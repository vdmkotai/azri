// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { generateText } from 'ai';

import type { EvidencePacket, ExplainerPlan, Section } from '../../../types/src/index.ts';
import { ANTI_SLOP_FORBIDDEN_PHRASES, SECTION_PROMPTS } from '../prompts/index.ts';
import { computeCost } from '../providers/pricing.ts';
import type { Stage3Deps, Stage3Input, Stage3Output } from './types.ts';

const CONCURRENCY = 5;
const TIMEOUT_MS = 45_000;
const BRIEF_MAX_TOKENS = 150;
const DEFAULT_MAX_TOKENS = 500;
const FAILURE_PLACEHOLDER = '_(section generation failed; see file list)_';
const REPO_MODE_UNSUPPORTED_PLACEHOLDER = '_(section type not supported in repo mode)_';

function chunk<T>(arr: ReadonlyArray<T>, size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Stage 3 section timeout')), ms);
    }),
  ]);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function stripAntiSlop(text: string): string {
  let out = text;
  for (const phrase of ANTI_SLOP_FORBIDDEN_PHRASES) {
    const re = new RegExp(escapeRegExp(phrase), 'giu');
    out = out.replace(re, '');
  }
  return out
    .replace(/[ \t]{2,}/gu, ' ')
    .replace(/[ \t]+\n/gu, '\n')
    .trim();
}

function buildUserPrompt(section: Section, packets: EvidencePacket[], input: Stage3Input): string {
  const focusLine = input.config.focusAreas?.length
    ? `\nFOCUS AREAS (prioritize these): ${input.config.focusAreas.join(', ')}\n`
    : '';
  const briefLine = input.config.brief
    ? '\nBRIEF MODE: cap output to ~150 tokens, no preamble.\n'
    : '';
  const packetBlocks = packets
    .map(
      (packet) =>
        `### Packet ${packet.id} (${packet.path}, importance ${packet.importance})\n` +
        `Summary: ${packet.summary}\nSymbols: ${packet.symbols.join(', ') || '(none)'}\n` +
        `Risk signals: ${packet.riskSignals.join(', ') || '(none)'}`,
    )
    .join('\n\n');
  const hunkBlock =
    section.sectionType === 'annotated-diff' && input.change
      ? '\n\n### Relevant diff hunks:\n' +
        input.change.files
          .filter((file) => section.files.includes(file.path))
          .map((file) => `--- ${file.path} ---\n${file.patch}`)
          .join('\n\n')
          .slice(0, 8000)
      : '';

  return [
    focusLine + briefLine,
    `## Section: ${section.title}`,
    `Type: ${section.sectionType} · Importance: ${section.importance}`,
    section.files.length > 0 ? `Files in scope: ${section.files.join(', ')}` : '',
    '',
    'Evidence packets:',
    packetBlocks || '(none)',
    hunkBlock,
  ]
    .filter(Boolean)
    .join('\n');
}

async function generateOneSection(
  section: Section,
  input: Stage3Input,
  deps: Stage3Deps,
): Promise<{ section: Section; tokensIn: number; tokensOut: number; failed: boolean }> {
  if (input.mode === 'repo' && section.sectionType === 'annotated-diff') {
    return {
      section: { ...section, proseMarkdown: REPO_MODE_UNSUPPORTED_PLACEHOLDER },
      tokensIn: 0,
      tokensOut: 0,
      failed: true,
    };
  }

  const systemPrompt = SECTION_PROMPTS[section.sectionType];
  if (!systemPrompt) {
    return {
      section: { ...section, proseMarkdown: '_(unknown section type)_' },
      tokensIn: 0,
      tokensOut: 0,
      failed: true,
    };
  }

  const packets = section.evidencePacketIds
    .map((id) => input.evidenceGraph.packets[id])
    .filter((packet): packet is EvidencePacket => packet !== undefined);
  const userPrompt = buildUserPrompt(section, packets, input);
  const maxOutputTokens = input.config.brief ? BRIEF_MAX_TOKENS : DEFAULT_MAX_TOKENS;

  try {
    const result = await withTimeout(
      generateText({
        model: deps.reasoningModel,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens,
      }),
      TIMEOUT_MS,
    );
    const proseMarkdown = stripAntiSlop(result.text);
    return {
      section: { ...section, proseMarkdown },
      tokensIn: result.usage.inputTokens ?? 0,
      tokensOut: result.usage.outputTokens ?? 0,
      failed: false,
    };
  } catch (e) {
    deps.logger.warn('stage3.section.failed', {
      sectionId: section.id,
      sectionType: section.sectionType,
      error: e instanceof Error ? e.message : String(e),
    });
    return {
      section: { ...section, proseMarkdown: FAILURE_PLACEHOLDER },
      tokensIn: 0,
      tokensOut: 0,
      failed: true,
    };
  }
}

export async function runStage3(input: Stage3Input, deps: Stage3Deps): Promise<Stage3Output> {
  const t0 = Date.now();
  deps.logger.info('stage3.start', { sections: input.plan.sections.length, mode: input.mode });

  let tokensIn = 0;
  let tokensOut = 0;
  let perSectionFailures = 0;
  const filledSections: Section[] = [];

  for (const batch of chunk(input.plan.sections, CONCURRENCY)) {
    const results = await Promise.all(
      batch.map((section) => generateOneSection(section, input, deps)),
    );
    for (const result of results) {
      filledSections.push(result.section);
      tokensIn += result.tokensIn;
      tokensOut += result.tokensOut;
      if (result.failed) perSectionFailures++;
    }
  }

  const plan: ExplainerPlan = { ...input.plan, sections: filledSections };
  const costUsd = computeCost(deps.provider, 'reasoning', tokensIn, tokensOut, 0).totalUsd;
  const durationMs = Date.now() - t0;
  deps.logger.info('stage3.end', {
    filled: filledSections.length,
    failures: perSectionFailures,
    tokensIn,
    tokensOut,
    costUsd,
    durationMs,
  });

  return { plan, tokensIn, tokensOut, costUsd, perSectionFailures, durationMs };
}
