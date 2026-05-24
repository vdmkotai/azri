// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  const target = input.mode === 'pr' ? 'pull request' : 'repository';
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "TL;DR" hero section for this ${target}.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "hook":        string  // 1 sentence, plain English, no jargon, <= 160 chars
  "description": string  // 2–3 sentences explaining what users actually do, <= 400 chars
  "stats":       Array<{
    "label": string  // short caption, <= 40 chars (e.g. "Files", "Languages", "Stack")
    "value": string  // PUNCHY scalar, <= 20 chars (numbers, single words, version refs)
    "hint":  string? // optional clarifier, <= 80 chars
  }>                 // min 3, max 6 entries
}

Style guidance:
- The hook MUST be plain English. No technical jargon, no acronyms.
- The description explains what users do with this ${target}, not how it's built.
- Stats are concrete numbers grounded in the input above
  (file count, line count, language count, contributors, modules, endpoints).
- Stat "value" MUST be SHORT and PUNCHY — a number, a single word, a version,
  a percentage. Examples of GOOD values: "248", "12", "TypeScript", "Bun",
  "v0.3.0", "85%", "Next.js". Examples of BAD values (DO NOT EMIT):
  "Next.js 16 + Convex + Clerk" (too long, multi-part), "248 files across 30
  directories" (sentence not scalar). Put context in "label" or "hint", not
  in "value".

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
