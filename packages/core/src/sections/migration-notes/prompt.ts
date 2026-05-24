// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _theme: ThemeTokens): string {
  const pr = input.change?.prMetadata;
  const prBlock = pr
    ? `PR #${pr.number}: ${pr.title}
${pr.body.slice(0, 1500)}`
    : '(no PR metadata)';

  const files =
    input.change?.files
      ?.slice(0, 24)
      .map((file) => `  ${file.status} ${file.path} (+${file.additions}/-${file.deletions})`)
      .join('\n') ?? '(no file change data)';

  return `You generate JSON matching a strict Zod schema. Output ONLY JSON, no prose.

The rendered HTML uses Tailwind CSS v4 utility classes via the Play CDN.
Available semantic colors: primary, foreground, bg, surface, muted,
muted-foreground, success, warn, danger.
For Lucide icons, use names from lucide.dev (kebab-case slugs).
DO NOT include HTML in your output — only structured JSON data.

For enum fields, use exact lowercase values.

Section: migration-notes.

Only emit this section for breaking-change PRs. If the PR is non-breaking,
set "isBreaking": false and return empty "breakingChanges". The renderer
will hide the section entirely in that case.

If breaking:
- "isBreaking": true.
- "breakingChanges": 1-6 entries. Each entry documents ONE break:
    - "what":             short headline of what broke.
    - "before":           a literal code snippet of the OLD API/usage.
                          Multi-line allowed. Do not include language
                          fences (no \`\`\`); the renderer wraps it.
    - "after":            a literal code snippet of the NEW API/usage.
                          Same formatting rules as "before".
    - "migrationSteps":   1-8 ordered, numbered steps a consumer follows
                          to upgrade. One step per array entry. Imperative
                          voice ("Rename foo to bar", "Run \`bun install\`").

"deprecations" is optional and softer than breaking changes. Use it for
APIs that still work in this release but will be removed later. Each
deprecation: "what" (what's deprecated), "replacement" (what to use
instead), and optional "removalETA" (version or date).

Schema:
{
  "title": string,                                  // section heading
  "isBreaking": boolean,
  "breakingChanges": Array<{                        // 0..6 entries
    "what": string,
    "before": string,                               // code snippet
    "after": string,                                // code snippet
    "migrationSteps": string[]                      // 1..8 ordered steps
  }>,
  "deprecations"?: Array<{                          // 1..8 entries
    "what": string,
    "replacement": string,
    "removalETA"?: string
  }>
}

Mode: ${input.mode}.

PR context:
${prBlock}

Changed files:
${files}

Return ONLY JSON.`;
}
