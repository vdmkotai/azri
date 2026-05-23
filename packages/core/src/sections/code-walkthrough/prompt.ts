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
  const languages = Object.keys(repo.languages).slice(0, 6).join(', ') || 'unspecified';
  const packets =
    Object.values(evidenceGraph.packets)
      .slice(0, 6)
      .map((packet) => `${packet.path}: ${packet.summary}`)
      .join('\n  - ') || '(none)';
  const changedFiles = change
    ? change.files
        .filter((file) => !file.isBinary && !file.isGenerated)
        .slice(0, 8)
        .map((file) => `${file.path} (+${file.additions}/-${file.deletions})`)
        .join('\n  - ')
    : '';
  return `Subject: ${subject}
Languages: ${languages}
Evidence summaries:
  - ${packets}${changedFiles ? `\nCandidate files to draw from:\n  - ${changedFiles}` : ''}`;
}

export function buildPrompt(input: SectionInput): string {
  return `${PROMPT_PREFIX}

Pick the single most interesting / illustrative code snippet from the input
and annotate it inline. Teach by example.

${summarizeContext(input)}

Constraints:
- Snippet MUST be a verbatim slice of real source. Maximum 40 lines.
- Provide 1-6 inline annotations explaining the parts that matter.
- "lineOffset" is the 0-based line index WITHIN your snippet (NOT the file's line numbers).
- "language" must be a lowercase canonical name (typescript, python, rust, go, sql, bash, …).
- "lineRange" (optional) is the original file's line range, format "42-87".

Output JSON shape:
{
  "title":     "Short descriptive title",
  "filePath":  "src/example/file.ts",
  "lineRange": "42-87",
  "language":  "typescript",
  "code":      "raw verbatim source, multi-line, max 40 lines",
  "annotations": [
    { "lineOffset": 0, "text": "Why this line matters" }
  ]
}`;
}
