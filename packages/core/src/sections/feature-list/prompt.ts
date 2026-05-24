// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

const PROMPT_PREFIX = `Generate JSON matching the schema. Output ONLY JSON. The HTML uses Tailwind v4. Semantic colors: primary, foreground, bg, surface, muted, muted-foreground, success, warn, danger. Use Lucide icons via <i data-lucide=...>. DO NOT include HTML in your output.`;

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${PROMPT_PREFIX}

You are generating the "Feature list" section for this repository.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title":    string,                           // <= 120 chars, e.g. "What you can do today"
  "features": Array<{
    "name":        string,                      // <= 80 chars, noun-led ("One-click rollback")
    "description": string,                      // <= 280 chars, 1-2 sentences of user-visible benefit
    "status":      "shipped" | "beta" | "planned",
    "icon":        string                       // Lucide icon slug, lowercase kebab-case
                                                // e.g. "zap", "shield-check", "git-branch",
                                                // "search", "bell", "clock", "puzzle"
  }>                                             // min 3, max 12 entries
}

Style guidance:
- A "feature" is a DISTINCT user-visible capability — not an implementation
  detail. "Authentication" is a feature; "argon2 password hashing" is not.
- Status truthfully reflects the codebase:
  - "shipped"  — present in default branch and works end-to-end.
  - "beta"     — present but flagged, experimental, or behind opt-in.
  - "planned"  — clearly referenced (roadmap, TODO, issue) but NOT yet usable.
  Default to "shipped" when unsure if evidence shows the code path works.
- Pick a Lucide icon that visually echoes the feature. Useful slugs:
  zap, shield-check, search, bell, clock, puzzle, lock, eye, share-2, link,
  download, upload, git-branch, terminal, sparkles, wand-sparkles, layers,
  database, gauge, key, package, plug, send, settings, sliders.
- Order features by likely user impact (highest first), not by alphabet.
- 3 to 12 features. Combine adjacent micro-features into one entry instead of
  bloating the list.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
