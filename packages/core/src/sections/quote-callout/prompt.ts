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
  const readmeExcerpt = repo.readme ? repo.readme.slice(0, 1000) : '';
  const prBody = change?.prMetadata?.body?.slice(0, 800) ?? '';
  const evidenceLines = Object.values(evidenceGraph.packets)
    .slice(0, 6)
    .map((packet) => `- ${packet.path}: ${packet.summary}`)
    .join('\n');
  return `Subject: ${subject}
${readmeExcerpt ? `README excerpt:\n${readmeExcerpt}\n` : ''}${prBody ? `PR body excerpt:\n${prBody}\n` : ''}${evidenceLines ? `Evidence summaries:\n${evidenceLines}` : ''}`;
}

export function buildPrompt(input: SectionInput): string {
  return `${PROMPT_PREFIX}

Extract one important statement, principle, or quote worth highlighting.

${summarizeContext(input)}

Pick something with substance: a design principle, a memorable phrasing, a
clear policy statement, an opinionated stance. Avoid empty filler.

The "quote" field must be the exact text WITHOUT surrounding quotation marks.
The renderer adds curly quotes automatically.

"attribution" is optional. Use it for:
- a source file path:        "src/example/file.ts"
- a documentation reference: "README.md" or "docs/ADR-007.md"
- a person:                  "Alice Author"

If you include "url", it must be an absolute http(s) URL.

Output JSON shape:
{
  "quote": "The exact text to highlight (1-3 sentences, no surrounding quotes)",
  "attribution": { "source": "src/example/file.ts", "url": "https://github.com/..." }
}`;
}
