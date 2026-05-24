// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const RegressionRiskSeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const RegressionRiskEntrySchema = z.object({
  severity: RegressionRiskSeveritySchema,
  area: z.string().min(1).max(140),
  description: z.string().min(1).max(400),
  mitigation: z.string().min(1).max(400).optional(),
});

export type RegressionRiskSeverity = z.infer<typeof RegressionRiskSeveritySchema>;
export type RegressionRiskEntry = z.infer<typeof RegressionRiskEntrySchema>;

export const RegressionRiskDataSchema = z.object({
  title: z.string().min(1).max(140),
  risks: z.array(RegressionRiskEntrySchema).min(1).max(8),
});

export type RegressionRiskData = z.infer<typeof RegressionRiskDataSchema>;
