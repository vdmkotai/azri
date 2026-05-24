// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const RollbackComplexityEnum = z.enum(['simple', 'moderate', 'complex']);

export const RollbackStepSchema = z.object({
  number: z.number().int().positive().max(8),
  command: z.string().min(1).max(400),
  description: z.string().min(1).max(240),
});

export const RollbackDataMigrationSchema = z.object({
  reversible: z.boolean(),
  notes: z.string().min(1).max(400),
});

export const RollbackPlanDataSchema = z.object({
  title: z.string().min(1).max(80),
  complexity: RollbackComplexityEnum,
  steps: z.array(RollbackStepSchema).min(1).max(8),
  warnings: z.array(z.string().min(1).max(240)).max(6).optional(),
  dataMigration: RollbackDataMigrationSchema.optional(),
});

export type RollbackComplexity = z.infer<typeof RollbackComplexityEnum>;
export type RollbackStep = z.infer<typeof RollbackStepSchema>;
export type RollbackDataMigration = z.infer<typeof RollbackDataMigrationSchema>;
export type RollbackPlanData = z.infer<typeof RollbackPlanDataSchema>;
