// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

const PROMPT_PREFIX = `Generate JSON matching the schema. Output ONLY JSON. The HTML uses Tailwind v4. Semantic colors: primary, foreground, bg, surface, muted, muted-foreground, success, warn, danger. For Mermaid: valid v11 syntax. DO NOT include HTML in your output.`;

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${PROMPT_PREFIX}

You are generating the "PR TL;DR" hero section for this pull request.

From the diff/PR body, extract: what changed, why it was changed (look in PR
description, commits, linked issue), and impact tier.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "what":   string  // 1 sentence describing what this PR does, <= 200 chars
  "why":    string  // 1-2 sentences explaining the motivation, <= 400 chars
  "impact": "major" | "minor" | "patch" | "internal"
  "stats":  {       // OPTIONAL — include only if you can ground it in the diff
    "filesChanged": number,
    "additions":    number,
    "deletions":    number
  }
}

Impact guidance:
- major:    breaking API change, schema migration, removed feature, security fix
- minor:    new feature, additive API, notable behaviour change
- patch:    bug fix, dependency bump, small refactor
- internal: tests, docs, CI, tooling — no user-visible effect

Style:
- "what" reads like a release-note headline. Verb first. Concrete subject.
- "why" cites the trigger (issue, regression, customer request, plan).
- If PR body / commits give no rationale, say "Author did not state a reason."

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
