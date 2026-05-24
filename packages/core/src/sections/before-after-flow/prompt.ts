// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

const PROMPT_PREFIX = `Generate JSON matching the schema. Output ONLY JSON. The HTML uses Tailwind v4. Semantic colors: primary, foreground, bg, surface, muted, muted-foreground, success, warn, danger. For Mermaid: valid v11 syntax. DO NOT include HTML in your output.`;

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${PROMPT_PREFIX}

You are generating the "Before / After Flow" section for this pull request.

This section is for refactor / restructure PRs. Produce two Mermaid flow
diagrams (before + after) showing how a flow changed, plus a plain-English
diffSummary explaining the change.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title":         string,   // section heading, <= 140 chars
  "beforeMermaid": string,   // valid Mermaid v11 source for the "before" state
  "afterMermaid":  string,   // valid Mermaid v11 source for the "after" state
  "diffSummary":   string    // 1-2 sentences, <= 400 chars, plain English
}

Rules:
- Both diagrams MUST be valid Mermaid v11 syntax (flowchart preferred).
- Both diagrams should describe the SAME flow at the SAME level of abstraction,
  so a reader can compare them node-for-node.
- 4-10 nodes per diagram is the sweet spot.
- diffSummary names what shifted: nodes added / removed, edges rerouted,
  responsibilities moved, etc.
- DO NOT embed <script tags, javascript: URLs, or </pre fragments anywhere —
  they will be rejected at render time.
- If the PR is NOT a refactor (just a feature add with no prior flow), still
  give the best comparison possible: an empty/minimal "before" with a single
  placeholder node is acceptable.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
