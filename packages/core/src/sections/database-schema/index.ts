// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { DatabaseSchemaDataSchema, type DatabaseSchemaData } from './schema.ts';

export {
  DatabaseFieldSchema,
  DatabaseKindEnum,
  DatabaseSchemaDataSchema,
  DatabaseTableSchema,
  type DatabaseField,
  type DatabaseKind,
  type DatabaseSchemaData,
  type DatabaseTable,
} from './schema.ts';

export const databaseSchemaSection: SectionType<DatabaseSchemaData> = {
  id: 'database-schema',
  name: 'Database schema',
  description:
    'Per-table cards showing data model: table/collection name, kind (SQL, document, KV, graph), purpose, and field list with types. Use when the repo has identifiable database schemas (Prisma, Drizzle, Convex, SQL DDL, Mongoose, etc.).',
  applicableFor: ['repo'],
  schema: DatabaseSchemaDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 3000, tokensOut: 1200 },
};

registerSection(databaseSchemaSection);
