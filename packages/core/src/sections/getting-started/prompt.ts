// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Getting started" section.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                                  // <= 80 chars, e.g. "Run it locally"
  "prereqs": Array<{                                // min 1, max 6
    "tool":    string,                              // e.g. "Bun", "Node.js", "Docker"
    "version": string?,                             // optional version, e.g. ">= 1.1.0"
    "slug":    string?                              // optional Simple Icons slug for logo
  }>,
  "steps": Array<{                                  // min 2, max 8
    "command":     string,                          // shell command, e.g. "bun install"
    "description": string                           // 1 sentence, <= 200 chars
  }>
}

Style guidance:
- "prereqs" come from package.json \`engines\`, tool versions in CI configs,
  Dockerfile FROM lines, README install sections, .nvmrc / .tool-versions /
  asdf files. Do not invent prereqs.
- For "slug", use the exact lowercase Simple Icons slug from simpleicons.org
  ("bun", "nodedotjs", "docker", "git", "pnpm", "postgresql", "redis").
  Skip "slug" entirely if no matching brand exists. Lowercase, alphanumeric + hyphens only.
- "steps" come from README setup instructions, scripts in package.json, or
  obvious bootstrap commands. Cover: install deps, configure env, run dev server.
  Typical sequence: clone -> install -> configure -> run dev -> open URL.
- "command" is the exact shell command users should type. Keep it copy-pastable
  ("bun install", "cp .env.example .env", "bunx convex dev").
- "description" is one sentence explaining what the command does
  ("Install JavaScript dependencies", not "Run bun install").

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
