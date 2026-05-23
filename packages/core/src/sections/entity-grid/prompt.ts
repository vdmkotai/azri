// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating an "Entity grid" section (Cast-of-Characters style).

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title":    string,                       // <= 80 chars, e.g. "Cast of characters"
  "entities": Array<{
    "name":        string,                  // <= 40 chars
    "role":        string,                  // <= 80 chars, 1-line role
    "tech":        string,                  // <= 40 chars, primary tech (e.g. "Next.js", "Postgres")
    "description": string,                  // <= 280 chars, 2 sentences
    "color":       "blue" | "purple" | "orange" | "green" | "pink" | "amber"
  }>                                         // min 2, max 8 entries
}

Style guidance:
- Identify 2–8 KEY system components, services, or processes that interact.
  Examples: "Web app", "API server", "Background worker", "Database", "Edge function".
- Each entity gets one role line, one primary tech, and a 2-sentence description
  of what it owns and how it talks to other entities.
- Assign DISTINCT colors so a reader can track each entity across other sections
  on the same page. Do not repeat a color unless you must (>6 entities).
- Order entities from highest-touch (most user-facing) to lowest-touch (infra).
- Skip purely passive things ("the README", "the LICENSE file") — only entities
  that participate in runtime behavior.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
