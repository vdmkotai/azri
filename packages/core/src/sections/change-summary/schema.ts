// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const ChangeSummaryFileKindSchema = z.enum(['added', 'modified', 'removed']);

export const ChangeSummaryFileSchema = z.object({
  path: z.string().min(1).max(400),
  kind: ChangeSummaryFileKindSchema,
  bytesChanged: z.number().int().min(0).optional(),
});

export const ChangeSummaryGroupSchema = z.object({
  module: z.string().min(1).max(120),
  rationale: z.string().min(1).max(320),
  files: z.array(ChangeSummaryFileSchema).min(1).max(40),
});

export const ChangeSummaryDataSchema = z.object({
  title: z.string().min(1).max(140),
  groups: z.array(ChangeSummaryGroupSchema).min(1).max(8),
});

export type ChangeSummaryFileKind = z.infer<typeof ChangeSummaryFileKindSchema>;
export type ChangeSummaryFile = z.infer<typeof ChangeSummaryFileSchema>;
export type ChangeSummaryGroup = z.infer<typeof ChangeSummaryGroupSchema>;
export type ChangeSummaryData = z.infer<typeof ChangeSummaryDataSchema>;
