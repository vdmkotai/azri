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

Section: link-callout.

Reference an external resource: documentation page, GitHub issue/PR, blog
article, tool, library. Brief title and 1-2 sentence description of why it
matters here.

Schema:
{
  "url": string,                                    // must start with https://
  "title": string,                                  // short, ~4-10 words
  "description": string,                            // 1-2 sentences on why this link matters
  "kind"?: "docs" | "issue" | "pr" | "article" | "tool" | "repo"
}

Mode: ${input.mode}.
Only link to publicly accessible URLs. Don't invent links — only reference
URLs that actually exist in the input context.

Return ONLY JSON.`;
}
