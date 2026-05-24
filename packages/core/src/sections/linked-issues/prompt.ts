// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Linked issues" section: the GitHub issues this PR
references via "Closes #N", "Fixes #N", "Refs #N", or "Blocks #N" — either in
the PR body or in commit messages.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                                  // <= 80 chars, e.g. "Linked issues"
  "issues": Array<{                                 // min 1, max 6
    "number":   integer > 0,                        // the issue number, e.g. 142
    "title":    string,                             // <= 240 chars, issue title verbatim
    "url":      string,                             // https:// URL to the issue
    "status":   "open" | "closed" | "merged",       // current state
    "relation": "closes" | "fixes" | "references" | "blocks"
                                                    //   - "closes"/"fixes" = this PR resolves the issue
                                                    //   - "references"     = related but not closing
                                                    //   - "blocks"         = issue must land first
  }>
}

Where to look:
- PR body for "Closes #N", "Fixes #N", "Resolves #N", "Refs #N", "See #N"
- Commit messages for the same keywords
- The PR title sometimes contains "(fixes #N)" inline

Style guidance:
- Only include issues that are ACTUALLY referenced in the PR / commits. Do not
  guess or invent linked issues.
- Use the FULL https://github.com/<owner>/<repo>/issues/<n> URL form.
- If the input does not surface enough metadata to know an issue's status,
  default to "open".
- "title" should be the issue's own title, not a summary you wrote.
- DO NOT include HTML — JSON only.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
