// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Deployment map" section: where each piece of this
project actually runs in production.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title":       string,                                  // <= 80 chars, e.g. "Where it runs"
  "deployments": Array<{
    "component": string,                                  // <= 60, e.g. "web", "api", "worker", "edge function"
    "runtime":   string,                                  // <= 60, e.g. "Node 22", "Bun 1.1", "Python 3.12", "Docker"
    "host":      "vercel" | "railway" | "flyio" | "cloudflare"
               | "aws" | "gcp" | "self-hosted" | "cdn" | "other",
    "url":       string?,                                 // optional, public URL if known
    "region":    string?,                                 // optional, e.g. "iad1", "us-east-1"
    "notes":     string?                                  // optional, <= 240 chars
  }>                                                       // min 1, max 10
}

Style guidance:
- Identify deployment targets from CONCRETE evidence in the repo:
    vercel.json, railway.json / railway.toml, fly.toml, Dockerfile,
    wrangler.toml / wrangler.jsonc, .github/workflows/*.yml, docker-compose.yml,
    netlify.toml, terraform files, README "Deploy" sections.
- DO NOT invent deployments. If only Dockerfile exists with no host hint,
  use "self-hosted". If repo ships a CDN script, use "cdn".
- "component" is the role ("web frontend", "background worker"), not the host.
- "runtime" is the actual runtime + version when visible
  ("Bun 1.1", "Node 22", "Python 3.12 on Alpine"). Otherwise the language family.
- Use lowercase canonical host enum values exactly. "flyio" not "fly.io".
- DO NOT include HTML — JSON only.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
