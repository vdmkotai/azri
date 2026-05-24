// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

const PROMPT_PREFIX = `Generate JSON matching the schema. Output ONLY JSON. The HTML uses Tailwind v4. Semantic colors: primary, foreground, bg, surface, muted, muted-foreground, success, warn, danger. Use Lucide icons via <i data-lucide=...>. DO NOT include HTML in your output.`;

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${PROMPT_PREFIX}

You are generating the "Project overview" section for this repository.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "headline":    string,                       // <= 200 chars, plain English, what the app DOES (not the tech)
  "description": string,                       // 3-5 sentences, <= 800 chars total, expands on the headline
  "personas":    Array<{
    "name":       string,                      // <= 60 chars, e.g. "Indie developer", "Site reliability engineer"
    "motivation": string                       // <= 200 chars, why this persona uses the project (1 sentence)
  }>                                            // min 1, max 4 entries
}

Style guidance:
- The headline reads like a product tagline written for a human, not a recruiter.
  Avoid jargon, frameworks, and acronyms. Describe the OUTCOME a user gets.
- The description must be 3 to 5 complete sentences. Each sentence pushes the
  story forward: what the user starts with, what they do, what they leave with.
- Personas are CONCRETE roles ("Indie iOS developer launching their first app"),
  not generic ("user", "developer"). Each motivation explains the JOB they are
  hiring this project to do.
- Order personas from most-central (primary user) to most-peripheral.
- Skip the obvious "the maintainer" persona unless the project is genuinely
  developer-tooling for its own contributors.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
