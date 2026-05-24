// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _theme: ThemeTokens): string {
  const pr = input.change?.prMetadata;
  const prBlock = pr
    ? `PR #${pr.number}: ${pr.title}
${pr.body.slice(0, 1500)}`
    : '(no PR metadata)';

  const commitBlock =
    input.change?.commits
      ?.slice(0, 12)
      .map((commit) => `- ${commit.sha.slice(0, 7)}: ${commit.message.split('\n')[0]}`)
      .join('\n') ?? '(no commit data)';

  return `You generate JSON matching a strict Zod schema. Output ONLY JSON, no prose.

The rendered HTML uses Tailwind CSS v4 utility classes via the Play CDN.
Available semantic colors: primary, foreground, bg, surface, muted,
muted-foreground, success, warn, danger.
For Lucide icons, use names from lucide.dev (kebab-case slugs).
DO NOT include HTML in your output — only structured JSON data.

For enum fields, use exact lowercase values.

Section: investigation.

Reconstruct the debugging or investigation journey behind this PR.
Source material: the PR body, commit messages, and any linked issues.
If a structured reasoning capture exists (e.g., .azri/sessions/<branch>.md
referenced in evidence), prefer that. Otherwise infer hypotheses from the
narrative in commits and the PR description.

Each hypothesis is one thing the author wondered about or tested:
- "investigation" describes what was checked (1-2 sentences).
- "verdict" is the outcome:
  - "confirmed"     — the hypothesis turned out to be true / the suspected cause.
  - "disproved"     — checked and ruled out.
  - "inconclusive"  — couldn't fully prove or disprove from available signal.
- "evidence" is optional 1-2 sentences naming the file, log, or check that
  produced the verdict.

Order hypotheses chronologically (number 1 = first thing tried).
2 minimum, 8 maximum. Conclusion ties them together in 1-2 sentences:
what the root cause turned out to be, or what was learned.

Schema:
{
  "title": string,                                  // section heading
  "hypotheses": Array<{                             // 2..8 entries
    "number": number,                               // 1-based ordering
    "title": string,                                // short hypothesis name
    "investigation": string,                        // what was checked (1-2 sentences)
    "verdict": "confirmed" | "disproved" | "inconclusive",
    "evidence"?: string                             // optional evidence (1-2 sentences)
  }>,
  "conclusion": string                              // 1-2 sentences
}

Mode: ${input.mode}.

PR context:
${prBlock}

Commit log:
${commitBlock}

Be honest about inconclusive verdicts. Don't fabricate hypotheses that
aren't supported by the source material.

Return ONLY JSON.`;
}
