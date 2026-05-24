// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const KeyFileImportanceEnum = z.enum(['entry', 'critical', 'reference']);

export const KeyFileEntrySchema = z.object({
  path: z.string().min(1).max(240),
  importance: KeyFileImportanceEnum,
  why_first: z.string().min(1).max(320),
});

export const KeyFilesDataSchema = z.object({
  title: z.string().min(1).max(80),
  files: z.array(KeyFileEntrySchema).min(3).max(10),
});

export type KeyFileImportance = z.infer<typeof KeyFileImportanceEnum>;
export type KeyFileEntry = z.infer<typeof KeyFileEntrySchema>;
export type KeyFilesData = z.infer<typeof KeyFilesDataSchema>;
