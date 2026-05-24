// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const DatabaseKindEnum = z.enum(['sql', 'document', 'kv', 'graph']);

export const DatabaseFieldSchema = z.object({
  name: z.string().min(1).max(60),
  type: z.string().min(1).max(60),
  notes: z.string().min(1).max(160).optional(),
});

export const DatabaseTableSchema = z.object({
  name: z.string().min(1).max(60),
  kind: DatabaseKindEnum,
  purpose: z.string().min(1).max(200),
  fields: z.array(DatabaseFieldSchema).min(1).max(15),
});

export const DatabaseSchemaDataSchema = z.object({
  title: z.string().min(1).max(80),
  tables: z.array(DatabaseTableSchema).min(1).max(8),
});

export type DatabaseKind = z.infer<typeof DatabaseKindEnum>;
export type DatabaseField = z.infer<typeof DatabaseFieldSchema>;
export type DatabaseTable = z.infer<typeof DatabaseTableSchema>;
export type DatabaseSchemaData = z.infer<typeof DatabaseSchemaDataSchema>;
