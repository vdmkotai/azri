// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _theme: ThemeTokens): string {
  return `You generate JSON matching a strict Zod schema. Output ONLY JSON, no prose.

The rendered HTML uses Tailwind CSS v4 utility classes via the Play CDN.
Available semantic colors: primary, foreground, bg, surface, muted,
muted-foreground, success, warn, danger.
DO NOT include HTML in your output — only structured JSON data.

For URLs, use https:// only. For enum fields, use exact lowercase values.

Section: comparison-table.

Compare two things side-by-side: before/after a change, this approach vs that
approach, current vs proposed. Each row has an aspect being compared and the
two values, optionally marked with how it changed.

Schema:
{
  "title": string,
  "leftLabel": string,                              // header for the "left" column (e.g. "Before")
  "rightLabel": string,                             // header for the "right" column (e.g. "After")
  "rows": Array<{                                   // 2..12 rows
    "aspect": string,                               // what is being compared
    "left": string,                                 // value on the left side
    "right": string,                                // value on the right side
    "change"?: "added" | "removed" | "changed" | "unchanged"
  }>
}

Mode: ${input.mode}.
Keep cell text short (under 120 chars). Use change tags only when meaningful.

Return ONLY JSON.`;
}
