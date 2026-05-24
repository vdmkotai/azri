// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const BreakingChangeSchema = z.object({
  what: z.string().min(1).max(240),
  before: z.string().min(1).max(2000),
  after: z.string().min(1).max(2000),
  migrationSteps: z.array(z.string().min(1).max(280)).min(1).max(8),
});

export const DeprecationSchema = z.object({
  what: z.string().min(1).max(240),
  replacement: z.string().min(1).max(280),
  removalETA: z.string().min(1).max(120).optional(),
});

export type BreakingChange = z.infer<typeof BreakingChangeSchema>;
export type Deprecation = z.infer<typeof DeprecationSchema>;

export const MigrationNotesDataSchema = z.object({
  title: z.string().min(1).max(140),
  isBreaking: z.boolean(),
  breakingChanges: z.array(BreakingChangeSchema).min(0).max(6),
  deprecations: z.array(DeprecationSchema).min(1).max(8).optional(),
});

export type MigrationNotesData = z.infer<typeof MigrationNotesDataSchema>;
