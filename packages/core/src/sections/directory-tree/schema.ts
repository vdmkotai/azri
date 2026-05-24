// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const DirectoryEntryKindEnum = z.enum(['dir', 'file']);

export const DirectoryEntrySchema = z.object({
  path: z.string().min(1).max(240),
  kind: DirectoryEntryKindEnum,
  description: z.string().min(1).max(240),
});

export const DirectoryTreeDataSchema = z.object({
  title: z.string().min(1).max(80),
  root: z.string().min(1).max(60),
  entries: z.array(DirectoryEntrySchema).min(4).max(25),
});

export type DirectoryEntryKind = z.infer<typeof DirectoryEntryKindEnum>;
export type DirectoryEntry = z.infer<typeof DirectoryEntrySchema>;
export type DirectoryTreeData = z.infer<typeof DirectoryTreeDataSchema>;
