// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Data flow" section: a Mermaid diagram of how real data
moves through this system, paired with a numbered explanation.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title":         string,                       // <= 140 chars, e.g. "How a request becomes a stored row"
  "mermaidSource": string,                       // valid Mermaid v11 syntax (flowchart or sequence preferred)
  "steps":         Array<{
    "number": integer,                           // 1..N, matches a labeled node/lane in the diagram
    "action": string                             // <= 240 chars, "Subject verbs object" form
  }>,                                            // min 3, max 10
  "notes":         string?                       // optional, <= 600 chars, caveats or context
}

Style guidance:
- Trace a REAL flow you can defend from the file tree, manifests, or README.
  Typical shape: user -> frontend -> API -> backend service -> storage -> response.
  Adapt to what actually exists (CLI -> file, webhook -> queue -> worker, etc.).
- Use Mermaid v11 syntax. Prefer 'flowchart LR' for request flows, 'sequenceDiagram'
  for protocols with replies. Label every node so steps can reference it.
- Number nodes in the diagram (e.g. "1: Browser", "2: API /sessions") so each
  step's "number" maps to exactly one diagram element.
- Steps are short imperative sentences. No marketing language, no hedging.
- DO NOT embed <script tags, javascript: URLs, or </pre fragments in mermaidSource.
  Those are rejected at render time.
- DO NOT include HTML — JSON only.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
