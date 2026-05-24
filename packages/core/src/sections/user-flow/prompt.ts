// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

const PROMPT_PREFIX = `Generate JSON matching the schema. Output ONLY JSON. The HTML uses Tailwind v4. Semantic colors: primary, foreground, bg, surface, muted, muted-foreground, success, warn, danger. Use Lucide icons via <i data-lucide=...>. DO NOT include HTML in your output.`;

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${PROMPT_PREFIX}

You are generating the "User flow" section for this repository.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                              // <= 120 chars, e.g. "From sign-up to first deploy"
  "steps": Array<{
    "number":      integer,                     // sequential, starts at 1, ascends
    "title":       string,                      // <= 80 chars, action-led ("Connect a repo")
    "description": string,                      // <= 280 chars, 1-2 sentences of what happens
    "icon":        string                       // Lucide icon slug, lowercase kebab-case
                                                // e.g. "log-in", "upload", "settings", "play",
                                                // "wand-sparkles", "rocket", "check-circle"
  }>                                             // min 3, max 8 entries
}

Style guidance:
- Trace the journey from FIRST contact (sign-up, install, paste URL) to the
  moment the user gets VALUE (artifact produced, dashboard visible, deploy live).
- Use 3 to 8 ordered steps. Fewer steps = clearer story.
- Number consecutively from 1. Do not skip numbers.
- Each title is an action ("Connect a repo"), not a noun ("Repository connection").
- Pick a Lucide icon that visually matches the action. Common useful slugs:
  log-in, upload, settings, play, wand-sparkles, rocket, check-circle, share-2,
  send, sparkles, file-text, eye, terminal, key, shield-check, zap.
- Skip internal/admin steps. Only show what the END USER experiences.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
