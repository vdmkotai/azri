// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Glossary" section.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                                  // <= 80 chars, e.g. "Glossary"
  "terms": Array<{                                  // min 3, max 20
    "term":       string,                           // domain term, <= 60 chars
    "definition": string,                           // 1-3 sentences, <= 400 chars
    "seeAlso":    Array<string>?                    // optional related terms, max 5
  }>
}

Style guidance:
- Pick 3-20 domain-specific terms that appear in this repo's code, docs,
  or names — terms a newcomer would need to look up. Examples:
  - Auth project:    "JWT", "refresh token", "PKCE", "OIDC"
  - ML project:      "tokenizer", "embedding", "fine-tune", "inference"
  - Finance project: "ledger", "double-entry", "settlement", "FX spread"
  - Web framework:   "middleware", "loader", "server component", "RSC payload"
- Do NOT include generic programming terms ("variable", "function", "class")
  unless they have a project-specific meaning that differs from the default.
- "term" is the canonical noun phrase as it appears in code/docs.
  Use the exact casing the project uses ("JWT" not "jwt", "GraphQL" not "graphql").
- "definition" explains the term in 1-3 plain sentences without circular
  references. Assume the reader is a competent engineer but new to this domain.
- "seeAlso" is optional. List related terms that also appear in the glossary
  (or are obvious follow-ups). Keep it to 0-5 entries.
- Order terms however you want; the renderer alphabetizes them.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
