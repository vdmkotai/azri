// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Tech stack" grid section.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                   // <= 60 chars, e.g. "Built with"
  "items": Array<{
    "name":     string,              // human-readable, e.g. "Next.js"
    "slug":     string,              // Simple Icons slug, lowercase, e.g. "nextdotjs"
    "role":     string,              // <= 80 chars, 1-line role (e.g. "frontend framework")
    "category": "Framework" | "Auth" | "Database" | "Storage" | "Compute"
              | "UI" | "Build" | "Deploy" | "Other"
  }>                                  // min 3, max 12 entries
}

Style guidance:
- Identify technologies actually used (package manifests, README, file tree).
  Do not invent technologies.
- Use the exact Simple Icons slug for each item — "nextdotjs" not "next.js",
  "tailwindcss" not "tailwind", "react" not "React.js". Lowercase, alphanumeric and hyphens.
- Roles are short noun phrases ("frontend framework", "realtime database",
  "background jobs"), not full sentences.
- Categorize each item using the enum above. Pick the closest fit; use "Other" sparingly.
- Prefer breadth over depth: cover frontend, backend, infra, build, and deploy
  when applicable, before duplicating a single category.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
