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

Section: data-table.

Present structured tabular data: list of objects with consistent fields.
Use for API endpoints, DB tables, file inventories, config matrices, etc.
Columns define the schema; rows are the data. Don't exceed 50 rows.

Schema:
{
  "title": string,                                  // section heading
  "columns": Array<{                                // 2..8 columns
    "key": string,                                  // matches row property name
    "label": string,                                // header text
    "align"?: "left" | "center" | "right"           // optional; numbers auto right-align
  }>,
  "rows": Array<Record<string, string | number>>,   // 1..50 rows; keys must match column keys
  "caption"?: string                                // optional footnote under the table
}

Mode: ${input.mode}.
Pick columns that are actually consistent across rows. Keep cell values short.

Return ONLY JSON.`;
}
