// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

const PROMPT_PREFIX = `Generate JSON matching the schema. Output ONLY JSON. The HTML uses Tailwind v4. Semantic colors: primary, foreground, bg, surface, muted, muted-foreground, success, warn, danger. For Mermaid: valid v11 syntax. DO NOT include HTML in your output.`;

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${PROMPT_PREFIX}

You are generating the "Annotated Diff" section for this pull request.

Pick the 1-5 most illustrative code changes from the diff. For each: file path,
line range, the code snippet (added / changed lines with leading +/-/space
markers, exactly like a unified diff), and a 1-2 sentence annotation that
explains what the change does.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                        // section heading, <= 140 chars
  "hunks": Array<{
    "filePath":   string,                 // path to the file in the diff
    "lineRange":  string,                 // "42-87" — original file line range
    "language":   string,                 // lowercase canonical (typescript, python, rust, go, sql, bash, …)
    "code":       string,                 // multi-line, EACH line starts with "+", "-", or " " (space) — diff markers
    "annotation": string                  // 1-2 sentences, <= 400 chars
  }>                                       // min 1, max 5
}

Rules:
- "code" is a UNIFIED DIFF style snippet. Every single line MUST begin with one of:
    "+ "  added line
    "- "  removed line
    "  "  unchanged context
  Do NOT include the @@ hunk header. Do NOT include file headers (---, +++).
- Keep each hunk tight: 5-25 lines is the sweet spot.
- Annotation explains the WHY and the user-visible effect, not just "added a function".
- Choose hunks that reveal the heart of the change, not boilerplate.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
