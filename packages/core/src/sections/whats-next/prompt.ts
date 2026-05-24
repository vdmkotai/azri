// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "What's next" section.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                                  // <= 80 chars, e.g. "What's next"
  "recentCommits": Array<{                          // min 0, max 10
    "sha":     string,                              // 7-40 lowercase hex chars
    "message": string,                              // commit subject, <= 200 chars
    "author":  string?,                             // optional author name
    "date":    string?                              // optional ISO date or relative
  }>,
  "openPRs"?: Array<{                               // min 0, max 5
    "number": number,                               // PR number, positive integer
    "title":  string,                               // PR title, <= 200 chars
    "status": string                                // e.g. "draft", "ready", "blocked"
  }>,
  "plannedWork"?: Array<{                           // min 0, max 5
    "title":  string,                               // <= 200 chars
    "source": string                                // where it came from
                                                    // e.g. ".sisyphus/plans/v0.3.md",
                                                    // "TODO.md", "ROADMAP.md"
  }>
}

Style guidance:
- "recentCommits" come from git log if available in the input. Use the
  short SHA (first 7+ chars). Subject line only — no body, no trailers.
  Omit merge commits and chore-only commits when possible.
- "openPRs" come from GitHub PR list if available. Skip the field
  entirely (or use an empty array) when no PR data is in the input.
- "plannedWork" comes from \`.sisyphus/plans/*.md\`, \`TODO.md\`,
  \`ROADMAP.md\`, or similar files in the file tree / README. Each entry
  cites the source file in "source". Skip the field entirely when no
  planning artifact exists.
- Prefer concrete, recent items. Do not invent commits, PRs, or plans
  that are not in the input — return empty arrays instead.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
