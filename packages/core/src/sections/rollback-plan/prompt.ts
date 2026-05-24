// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Rollback plan" section: how to undo this PR if it
breaks production.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title":      string,                             // <= 80 chars, e.g. "Rollback plan"
  "complexity": "simple" | "moderate" | "complex",
  "steps": Array<{                                  // min 1, max 8
    "number":      integer 1..8,                    // step number, sequential starting at 1
    "command":     string,                          // <= 400 chars, the exact shell / SQL / CLI command
                                                    //   e.g. "git revert <sha>", "kubectl rollout undo …"
    "description": string                           // <= 240 chars, one sentence on what this step does
  }>,
  "warnings":      Array<string>?,                  // optional, max 6 — gotchas during rollback
                                                    //   e.g. "Cache must be flushed after revert"
  "dataMigration": {                                // optional, present when this PR touched data
    "reversible": boolean,                          // true if down-migration exists and is safe
    "notes":      string                            // <= 400 chars, what to know about the data side
  }?
}

Complexity rubric:
- "simple":   one git revert + redeploy. No data, no config, no manual coordination.
- "moderate": multi-step (revert + cache flush, or revert + env var change). No
              irreversible data ops.
- "complex":  involves irreversible data migrations, multi-service coordination,
              feature-flag dance, or external party (DNS, third-party API) coupling.

Style guidance:
- ALWAYS lead with a 'git revert <merge-sha>' step where applicable.
- "command" must be a real, copy-pastable shell line. No placeholders like
  "<COMMAND HERE>". If the SHA isn't known, use a clearly bracketed placeholder
  like "<MERGE_SHA>" the operator can substitute.
- "warnings" capture the things that bite operators at 3am — race conditions,
  cache staleness, partial state.
- Include "dataMigration" ONLY if this PR adds/alters migrations, schema, or
  data-shape transforms. Mark reversible=false if the change drops columns or
  destroys data.
- Order steps in execution order, no gaps in "number".
- DO NOT include HTML — JSON only.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
