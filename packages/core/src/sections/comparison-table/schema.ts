// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const ComparisonRowSchema = z.object({
  aspect: z.string().min(1),
  left: z.string().min(1),
  right: z.string().min(1),
  change: z.enum(['added', 'removed', 'changed', 'unchanged']).optional(),
});

export const ComparisonTableDataSchema = z.object({
  title: z.string().min(1),
  leftLabel: z.string().min(1),
  rightLabel: z.string().min(1),
  rows: z.array(ComparisonRowSchema).min(2).max(12),
});

export type ComparisonRow = z.infer<typeof ComparisonRowSchema>;
export type ComparisonTableData = z.infer<typeof ComparisonTableDataSchema>;
