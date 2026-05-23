// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const DataTableColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  align: z.enum(['left', 'center', 'right']).optional(),
});

export const DataTableDataSchema = z.object({
  title: z.string().min(1),
  columns: z.array(DataTableColumnSchema).min(2).max(8),
  rows: z
    .array(z.record(z.union([z.string(), z.number()])))
    .min(1)
    .max(50),
  caption: z.string().optional(),
});

export type DataTableColumn = z.infer<typeof DataTableColumnSchema>;
export type DataTableData = z.infer<typeof DataTableDataSchema>;
