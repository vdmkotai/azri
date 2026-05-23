// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const RiskCalloutSeveritySchema = z.enum(['info', 'warn', 'danger']);

export const RiskCalloutDataSchema = z.object({
  severity: RiskCalloutSeveritySchema,
  title: z.string().min(1),
  body: z.string().min(1),
  suggestion: z.string().optional(),
});

export type RiskCalloutSeverity = z.infer<typeof RiskCalloutSeveritySchema>;
export type RiskCalloutData = z.infer<typeof RiskCalloutDataSchema>;
