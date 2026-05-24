// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Directory tree" section: an annotated map of the
most important paths in this repository.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title":   string,                              // <= 80 chars, e.g. "Repository map"
  "root":    string,                              // <= 60 chars, top-level folder label (e.g. repo name)
  "entries": Array<{
    "path":        string,                        // <= 240 chars, relative path from repo root
                                                  //   ("packages/core/src/index.ts", "apps/cli/")
    "kind":        "dir" | "file",
    "description": string                         // <= 240 chars, ONE sentence on what lives there
  }>                                              // min 4, max 25
}

Style guidance:
- Pick 4-25 of the MOST IMPORTANT paths. Bias toward:
    entry points (bin scripts, CLI mains, server bootstraps),
    package roots (packages/*, apps/*),
    primary source modules (src/, lib/, pkg/),
    config that explains architecture (Dockerfile, tsconfig.json, schema files).
- Skip noise: lockfiles, node_modules, .git, generated dist/, coverage reports.
- Sort entries top-down hierarchically: shallower paths first, then alphabetically.
- Directory paths SHOULD end with "/". File paths must not.
- Descriptions are short ("orchestrates the 6-stage pipeline"),
  not marketing ("a beautifully crafted module").
- DO NOT include HTML — JSON only.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
