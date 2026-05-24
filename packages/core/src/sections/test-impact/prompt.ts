// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _theme: ThemeTokens): string {
  const files = input.change?.files ?? [];
  const testFiles = files
    .filter((file) => /\.(?:test|spec)\.[cm]?[jt]sx?$|(?:^|\/)__tests__\//u.test(file.path))
    .slice(0, 24)
    .map((file) => `  ${file.status} ${file.path} (+${file.additions}/-${file.deletions})`)
    .join('\n');

  const productionFiles = files
    .filter((file) => !/\.(?:test|spec)\.[cm]?[jt]sx?$|(?:^|\/)__tests__\//u.test(file.path))
    .slice(0, 24)
    .map((file) => `  ${file.status} ${file.path} (+${file.additions}/-${file.deletions})`)
    .join('\n');

  return `You generate JSON matching a strict Zod schema. Output ONLY JSON, no prose.

The rendered HTML uses Tailwind CSS v4 utility classes via the Play CDN.
Available semantic colors: primary, foreground, bg, surface, muted,
muted-foreground, success, warn, danger.
For Lucide icons, use names from lucide.dev (kebab-case slugs).
DO NOT include HTML in your output — only structured JSON data.

For enum fields, use exact lowercase values.

Section: test-impact.

Identify test changes in the PR diff. Group them as:
- "added":   new test files or new test cases inside an existing test file.
            "coverage" describes what behavior the test verifies (1 sentence).
- "changed": existing test files modified (assertions retuned, fixtures
            updated, renamed, etc.). "change" describes what changed (1 sentence).

Optionally flag "uncovered" production areas — code that shipped without
matching test changes. Use sparingly and honestly: only when there's a real
behavior gap, not "every file deserves more tests."

If the PR has no test changes at all, you may return empty arrays for both
"added" and "changed" and rely on "uncovered" to make the point.

Schema:
{
  "title": string,                                  // section heading
  "added": Array<{                                  // 0..8 entries
    "testFile": string,                             // path to the test file
    "coverage": string                              // what the test verifies (1 sentence)
  }>,
  "changed": Array<{                                // 0..8 entries
    "testFile": string,                             // path to the test file
    "change": string                                // what changed (1 sentence)
  }>,
  "uncovered"?: {
    "areas": string[],                              // 1..8 file paths or feature names
    "reason": string                                // 1-2 sentences explaining the gap
  }
}

Mode: ${input.mode}.

Test files changed in this PR:
${testFiles || '(none detected)'}

Production files changed in this PR:
${productionFiles || '(none detected)'}

Return ONLY JSON.`;
}
