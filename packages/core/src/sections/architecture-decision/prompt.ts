// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { SectionInput } from '../types.ts';

const PROMPT_PREFIX = `You generate JSON matching a strict Zod schema. Output ONLY JSON, no prose.

The rendered HTML uses Tailwind CSS v4 utility classes via the Play CDN.
Available semantic colors: primary, foreground, bg, surface, muted,
muted-foreground, success, warn, danger.
DO NOT include HTML in your output — only structured JSON data.

For code language identifiers, use lowercase canonical names:
typescript, javascript, python, rust, go, sql, bash, json, yaml, html, css.`;

function summarizeContext(input: SectionInput): string {
  const { mode, repo, change, evidenceGraph } = input;
  const subject =
    mode === 'pr' && change?.prMetadata
      ? `PR #${change.prMetadata.number}: "${change.prMetadata.title}"`
      : `${repo.owner}/${repo.name}`;
  const manifests = Object.keys(repo.packageManifests).slice(0, 6).join(', ') || '(none)';
  const evidenceTops =
    Object.values(evidenceGraph.packets)
      .slice(0, 8)
      .map((packet) => `${packet.path}: ${packet.summary}`)
      .join('\n  - ') || '(none)';
  const readme = repo.readme ? repo.readme.slice(0, 800) : '';
  return `Subject: ${subject}
Manifests: ${manifests}
Evidence:
  - ${evidenceTops}${readme ? `\nREADME excerpt:\n${readme}` : ''}`;
}

export function buildPrompt(input: SectionInput): string {
  return `${PROMPT_PREFIX}

Document one intentional architectural choice the codebase has made.

${summarizeContext(input)}

Provide:
- "decision":     one-sentence statement of what was picked
- "alternatives": 1-4 rejected options, each with a brief "why_not"
- "why":          1-3 sentences explaining the rationale
- "tradeoffs":    (optional) what we GAIN vs what we COST/SACRIFICE
- "citations":    (optional) up to 10 file references in "path" or "path:line" form

Pick a choice that is actually visible in the evidence — runtime, framework,
data store, schema strategy, build tool, deployment target, auth model, etc.
Avoid vague "we chose to write clean code" filler.

Output JSON shape:
{
  "title":    "Short title of the decision",
  "decision": "One-sentence statement of what was picked",
  "alternatives": [
    { "option": "Alternative A", "why_not": "Reason it was rejected" }
  ],
  "why":      "1-3 sentences explaining the rationale",
  "tradeoffs": { "gain": "what we get", "cost": "what we give up" },
  "citations": ["src/example/file.ts:42", "docs/RFC.md"]
}`;
}
