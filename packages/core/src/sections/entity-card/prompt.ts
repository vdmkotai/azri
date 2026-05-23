// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating an "Entity card" section: the detail view of a SINGLE entity
that needs more depth than a grid cell allows.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "entity": {
    "name":        string,                  // <= 60 chars
    "role":        string,                  // <= 100 chars
    "tech":        string,                  // <= 60 chars
    "description": string,                  // <= 400 chars
    "color":       "blue" | "purple" | "orange" | "green" | "pink" | "amber"
  },
  "sections": Array<{
    "heading": string,                      // <= 80 chars
    "body":    string                       // <= 600 chars
  }>                                         // min 1, max 4 entries
}

Style guidance:
- Pick the MOST important entity from the input — typically the user-facing
  surface or the core service everything else orbits.
- The top-level description is the elevator pitch (what it owns, who calls it).
- Each sub-section drills into one facet: "Data model", "Lifecycle", "Failure modes",
  "Why this approach", etc. Headings are noun phrases; bodies are 2–4 sentences each.
- If you also produced an entity-grid in the same page, reuse the SAME color for
  this entity so the reader visually connects them.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
