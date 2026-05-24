// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Verification checklist" section for this PR: what was
actually verified before this PR was opened.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                                  // <= 80 chars, e.g. "Verified before opening"
  "items": Array<{                                  // min 2, max 10
    "description": string,                          // <= 240 chars, ONE concrete claim
                                                    //   e.g. "Login flow works end-to-end in Chrome and Safari"
    "verified":    boolean,                         // true if the author has evidence; false if listed but unchecked
    "method":      string?                          // <= 240 chars, REQUIRED when verified=true,
                                                    //   one sentence on HOW it was verified
                                                    //   e.g. "Ran the new vitest suite locally; 14 cases pass"
  }>
}

Categories to consider (pick what is actually evidenced in the PR / commits / body):
- Manual testing      ("clicked through the flow", "tested on mobile Safari")
- Automated tests     ("new unit test in foo.test.ts", "existing integration suite still passes")
- Edge cases          ("verified empty input", "verified non-ASCII payload")
- Deployment validation ("staging deploy green", "feature flag verified off in prod")
- Performance / a11y  ("Lighthouse score unchanged", "axe passes on changed page")

Style guidance:
- Items must be CONCRETE claims, not vibes. "Tests pass" alone is too vague —
  prefer "All existing snapshot tests pass; 3 new cases added in renderer.test.ts".
- If you cannot find evidence the author verified something, mark verified=false
  and OMIT the "method" field. Do not invent verification methods.
- Keep "method" to ONE sentence. No prose paragraphs.
- DO NOT include HTML — JSON only.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
