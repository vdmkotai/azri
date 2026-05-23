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

Section: risk-callout.

Flag a single risk, warning, or note. Severity tiers:
- "info":   FYI, low-impact, worth knowing.
- "warn":   caution needed; could cause friction or regression.
- "danger": will break / must fix before merging or shipping.

Schema:
{
  "severity": "info" | "warn" | "danger",
  "title": string,                                  // short, ~4-8 words
  "body": string,                                   // 1-3 sentences explaining the risk
  "suggestion"?: string                             // optional single sentence on what to do
}

Mode: ${input.mode}.
Pick severity honestly. Don't cry wolf with "danger" for stylistic nits.

Return ONLY JSON.`;
}
