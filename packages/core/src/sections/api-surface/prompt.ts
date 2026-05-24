// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "API surface" section.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                                  // <= 80 chars, e.g. "HTTP API"
  "endpoints": Array<{                              // min 1, max 20
    "method":  "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    "path":    string,                              // route path, e.g. "/api/users/:id"
    "purpose": string,                              // 1 sentence, <= 200 chars
    "auth":    string?                              // optional auth note, <= 80 chars
  }>
}

Style guidance:
- Identify HTTP endpoints from route files in the repo: Next.js \`route.ts\`
  / \`app/api/**\`, Express / Hono / Elysia / Fastify route registrations,
  Rails routes, FastAPI / Flask decorators, Django urls, tRPC routers
  (treat each procedure as one entry with method = POST), etc.
  Do not invent endpoints that are not in the input.
- Use the literal path string as registered. Keep colon params (\`:id\`)
  or bracket params (\`[id]\`) exactly as they appear in the source.
- "purpose" is one sentence describing what the endpoint does
  ("Create a new project", not "POST /projects endpoint").
- "auth" is optional. Use when the endpoint has a notable auth
  requirement: "auth required", "admin only", "public", "webhook signature".
  Skip when auth posture is the project default.
- Order endpoints from most-used / most-important to less-important;
  group related paths together when possible.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
