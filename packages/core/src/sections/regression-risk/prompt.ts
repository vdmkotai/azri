// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _theme: ThemeTokens): string {
  const files =
    input.change?.files
      ?.slice(0, 24)
      .map((file) => `  ${file.status} ${file.path} (+${file.additions}/-${file.deletions})`)
      .join('\n') ?? '(no file change data)';

  const pr = input.change?.prMetadata;
  const prBlock = pr
    ? `PR #${pr.number}: ${pr.title}
${pr.body.slice(0, 800)}`
    : '(no PR metadata)';

  return `You generate JSON matching a strict Zod schema. Output ONLY JSON, no prose.

The rendered HTML uses Tailwind CSS v4 utility classes via the Play CDN.
Available semantic colors: primary, foreground, bg, surface, muted,
muted-foreground, success, warn, danger.
For Lucide icons, use names from lucide.dev (kebab-case slugs).
DO NOT include HTML in your output — only structured JSON data.

For enum fields, use exact lowercase values.

Section: regression-risk.

Identify what could break as a result of this PR. Be concrete: name the
affected area and describe the failure mode, not vague "code quality" notes.

Severity grading (calibrate honestly — don't cry wolf):
- "critical": auth, payments, data loss, security, PII, multi-tenant
              isolation, anything that can corrupt or expose user data.
- "high":     core product feature breaks for many users, primary user
              flow regression, performance cliff on the hot path.
- "medium":   adjacent or secondary feature regression, edge-case
              behavior change, observability or operational gap.
- "low":      cosmetic, minor copy, low-traffic surface, non-blocking
              dev ergonomics.

Each risk is one entry: severity + area (where it could break) +
description (what could break and why) + optional mitigation
(how to reduce the risk: tests to add, feature flag, monitoring,
phased rollout, etc.).

Minimum 1, maximum 8. Order does not matter — the renderer sorts by
severity.

Schema:
{
  "title": string,                                  // section heading
  "risks": Array<{                                  // 1..8 entries
    "severity": "critical" | "high" | "medium" | "low",
    "area": string,                                 // short area name
    "description": string,                          // 1-3 sentences
    "mitigation"?: string                           // optional 1-2 sentences
  }>
}

Mode: ${input.mode}.

PR context:
${prBlock}

Changed files:
${files}

Return ONLY JSON.`;
}
