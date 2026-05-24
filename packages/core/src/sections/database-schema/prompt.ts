// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { GLOBAL_PROMPT_GUARD, summarizeInputForPrompt } from '../_shared.ts';
import type { SectionInput, ThemeTokens } from '../types.ts';

export function buildPrompt(input: SectionInput, _themeTokens: ThemeTokens): string {
  return `${GLOBAL_PROMPT_GUARD}

You are generating the "Database schema" section.

Input context:
${summarizeInputForPrompt(input)}

Schema (strict):
{
  "title": string,                                  // <= 80 chars, e.g. "Data model"
  "tables": Array<{                                 // min 1, max 8
    "name":    string,                              // table / collection name
    "kind":    "sql" | "document" | "kv" | "graph",
    "purpose": string,                              // 1-sentence purpose, <= 200 chars
    "fields":  Array<{                              // min 1, max 15
      "name":  string,                              // column / field name
      "type":  string,                              // SQL or app-level type
      "notes": string?                              // optional clarifier, <= 160 chars
    }>
  }>
}

Style guidance:
- Identify tables / collections from schema files in the repo: Prisma
  (\`schema.prisma\`), Drizzle (\`schema.ts\`), Convex (\`convex/schema.ts\`),
  SQL DDL (\`*.sql\`), Mongoose models, SQLAlchemy models, ActiveRecord,
  Ecto schemas, etc. Do not invent tables that are not in the input.
- "kind" maps to the underlying store:
  - "sql":      relational (Postgres, MySQL, SQLite, Planetscale)
  - "document": document store (Mongo, Firestore, Convex)
  - "kv":       key-value (Redis, DynamoDB, KV stores)
  - "graph":    graph DB (Neo4j, Dgraph)
- "purpose" is one sentence describing what this table holds and why
  ("Tracks user sessions for auth"), not a re-statement of the name.
- "fields" lists the most important 1-15 columns. Primary keys and foreign
  keys should be included when present. Use the project's own type names
  (\`uuid\`, \`text\`, \`v.id("users")\`, \`varchar(255)\`).
- "notes" is optional; use it for FK relations, indices, default values,
  enums, or "PII" markers. Skip when the type alone is self-explanatory.

Return ONLY valid JSON matching the schema. No prose, no Markdown fences.`;
}
