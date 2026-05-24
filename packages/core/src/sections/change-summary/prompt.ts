// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

const PROMPT_PREFIX = `Generate JSON matching the schema. Output ONLY JSON. The HTML uses Tailwind v4. Semantic colors: primary, foreground, bg, surface, muted, muted-foreground, success, warn, danger. For Mermaid: valid v11 syntax. DO NOT include HTML in your output.`;

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${PROMPT_PREFIX}

You are generating the "Change Summary" section for this pull request.

Group the changed files by module / concern. For each group: a short module name
(e.g., "API routes", "Database schema", "UI components", "Test fixtures",
"Build config"), a one-sentence rationale, and the list of files with their kind.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                    // section heading, <= 140 chars
  "groups": Array<{
    "module":    string,              // module name, <= 120 chars
    "rationale": string,              // one sentence, <= 320 chars
    "files": Array<{
      "path":         string,         // verbatim file path from the diff
      "kind":         "added" | "modified" | "removed",
      "bytesChanged": number?         // optional, if you can estimate from +/- counts
    }>                                // min 1, max 40 per group
  }>                                  // min 1, max 8 groups
}

Rules:
- Use the file statuses present in the diff verbatim — do NOT invent files.
- Map diff statuses: A -> "added", M -> "modified", D -> "removed",
  R/C (rename/copy) -> "modified".
- Prefer fewer, larger groups (2-5) over many tiny groups.
- "rationale" answers: why are these files grouped together, what is the
  shared purpose of the change?
- Sort groups by importance (most impactful first).

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
