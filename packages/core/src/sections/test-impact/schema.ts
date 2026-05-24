// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const TestAddedEntrySchema = z.object({
  testFile: z.string().min(1).max(240),
  coverage: z.string().min(1).max(280),
});

export const TestChangedEntrySchema = z.object({
  testFile: z.string().min(1).max(240),
  change: z.string().min(1).max(280),
});

export const TestUncoveredSchema = z.object({
  areas: z.array(z.string().min(1).max(200)).min(1).max(8),
  reason: z.string().min(1).max(400),
});

export type TestAddedEntry = z.infer<typeof TestAddedEntrySchema>;
export type TestChangedEntry = z.infer<typeof TestChangedEntrySchema>;
export type TestUncovered = z.infer<typeof TestUncoveredSchema>;

export const TestImpactDataSchema = z.object({
  title: z.string().min(1).max(140),
  added: z.array(TestAddedEntrySchema).min(0).max(8),
  changed: z.array(TestChangedEntrySchema).min(0).max(8),
  uncovered: TestUncoveredSchema.optional(),
});

export type TestImpactData = z.infer<typeof TestImpactDataSchema>;
