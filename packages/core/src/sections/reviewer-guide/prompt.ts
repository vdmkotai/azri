// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Reviewer guide" section: 2-6 ranked priorities telling
a code reviewer where to focus FIRST. Highest-risk / highest-judgement areas
go to rank 1.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                                  // <= 80 chars, e.g. "Where to focus your review"
  "priorities": Array<{                             // min 2, max 6
    "rank":          integer 1..6,                  // ranking (1 = highest priority)
    "area":          string,                        // <= 80 chars, named focus area
                                                    //   e.g. "Auth boundary", "Migration safety",
                                                    //        "Data validation", "Public API shape"
    "what_to_check": string,                        // <= 400 chars, 1-2 sentences telling the reviewer
                                                    //   what to scrutinize and why it matters
    "files":         Array<string>                  // min 1, max 5, repo-relative file paths the reviewer
                                                    //   should open for THIS priority
  }>
}

Style guidance:
- Rank by REVIEWER VALUE, not by line-count. A 5-line auth change outranks a
  200-line CSS refactor.
- "area" is a short noun phrase; "what_to_check" is the actionable directive.
- "files" must come from the PR's changed-file set. Do not invent paths.
- Each priority must have a UNIQUE rank starting at 1 with no gaps.
- "what_to_check" should answer: "what could go wrong here that the test suite
  would not catch?"
- DO NOT include HTML — JSON only.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
