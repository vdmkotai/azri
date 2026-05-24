// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

const PROMPT_PREFIX = `Generate JSON matching the schema. Output ONLY JSON. The HTML uses Tailwind v4. Semantic colors: primary, foreground, bg, surface, muted, muted-foreground, success, warn, danger. Use Lucide icons via <i data-lucide=...>. DO NOT include HTML in your output.`;

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${PROMPT_PREFIX}

You are generating the "UI overview" section for this repository.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title":   string,                            // <= 120 chars, e.g. "Anatomy of the dashboard"
  "regions": Array<{
    "name":     string,                         // <= 60 chars, e.g. "Sidebar", "Top bar", "Editor pane"
    "role":     string,                         // <= 120 chars, 1 phrase describing the region's job
    "contents": string                          // <= 400 chars, 1-3 sentences listing concrete elements
  }>                                             // min 2, max 8 entries
  "mockupAscii": string?                        // OPTIONAL, <= 4000 chars
                                                // Plain ASCII / box-drawing mockup of the layout.
                                                // Use chars: + - | space, OR ─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼.
                                                // No HTML, no escape sequences, no ANSI codes.
}

Style guidance:
- ONLY emit this section if the project has a real UI (web app, CLI TUI, mobile,
  desktop). For pure libraries, APIs, or non-visual tooling, the planner should
  not pick this section.
- Regions are NAMED SPATIAL ZONES the user perceives: "Sidebar", "Top bar",
  "Command palette", "Main canvas", "Inspector", "Status bar", "Modal".
- "role" is what the region IS FOR ("Primary navigation between workspaces").
- "contents" lists the actual widgets / controls inside the region.
- Order regions roughly from outer-chrome (header, sidebar) to inner (main, footer).
- The optional mockupAscii is a low-fidelity wireframe. Box-drawing chars are
  preferred. Keep lines <= 80 cols. Skip the mockup if you cannot draw something
  that genuinely clarifies the layout.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
