// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Key files" section: the 3-10 files a new contributor
should read first, ranked.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                              // <= 80 chars, e.g. "Start here"
  "files": Array<{
    "path":       string,                       // <= 240 chars, repo-relative path to ONE file
    "importance": "entry" | "critical" | "reference",
    "why_first":  string                        // <= 320 chars, ONE sentence answering
                                                //   "what will I learn from reading this first?"
  }>                                            // min 3, max 10
}

Importance taxonomy:
- "entry":     the door — main(), CLI bin, server bootstrap, public package entry
- "critical":  load-bearing internals — the orchestrator, the core type, the pipeline
- "reference": context — README, AGENTS.md, config schema, key test that defines behavior

Style guidance:
- Order matters: list in the order you would read them, most useful FIRST.
- Pick FILES (not directories). Each path must exist in the file tree sample.
- "why_first" answers what understanding the reader unlocks, not what the file does.
  Bad: "implements the cache".
  Good: "shows how Effect services are wired into the runtime layer".
- DO NOT include HTML — JSON only.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
