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
  const { mode, repo, change } = input;
  const subject =
    mode === 'pr' && change?.prMetadata
      ? `PR #${change.prMetadata.number} on ${repo.owner}/${repo.name}: "${change.prMetadata.title}"`
      : `repository ${repo.owner}/${repo.name}`;
  const languages = Object.keys(repo.languages).slice(0, 6).join(', ') || 'unspecified';
  const fileSample =
    repo.fileTree
      .slice(0, 12)
      .map((entry) => entry.path)
      .join('\n  - ') || '(empty)';
  const changeSummary = change
    ? `\nChanged files (${change.files.length}):\n  - ${change.files
        .slice(0, 12)
        .map((file) => `${file.path} (${file.status}, +${file.additions}/-${file.deletions})`)
        .join('\n  - ')}`
    : '';
  return `Subject: ${subject}
Languages: ${languages}
Sample file tree:
  - ${fileSample}${changeSummary}`;
}

export function buildPrompt(input: SectionInput): string {
  return `${PROMPT_PREFIX}

Generate a Mermaid diagram that visualizes a meaningful relationship in the input.

${summarizeContext(input)}

Source MUST be valid Mermaid v11 syntax. Do NOT embed <script tags, javascript: URLs,
or </pre fragments — those are rejected at render time.

Choose "kind" based on what you are showing:
- flowchart: data flows, decision trees, system topology
- sequence:  request/response interactions over time
- state:     state machines, lifecycle transitions
- class:     object hierarchies, type relationships
- git:       branch/commit relationships
- er:        entity-relationship (database schema)

Keep the diagram tight: 4-12 nodes is the sweet spot. Use semantic labels
that someone unfamiliar with the codebase can decode.

Output JSON shape:
{
  "title":   "Short descriptive title (one line)",
  "source":  "valid Mermaid v11 syntax, multi-line allowed",
  "caption": "(optional) 1-2 sentence explanation of what the diagram conveys",
  "kind":    "flowchart" | "sequence" | "state" | "class" | "git" | "er"
}`;
}
