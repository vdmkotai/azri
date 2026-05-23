// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const DecisionAlternativeSchema = z.object({
  option: z.string().min(1).max(140),
  why_not: z.string().min(1).max(400),
});

export type DecisionAlternative = z.infer<typeof DecisionAlternativeSchema>;

export const DecisionTradeoffSchema = z.object({
  gain: z.string().min(1).max(280),
  cost: z.string().min(1).max(280),
});

export type DecisionTradeoff = z.infer<typeof DecisionTradeoffSchema>;

export const ArchitectureDecisionDataSchema = z.object({
  title: z.string().min(1).max(140),
  decision: z.string().min(1).max(280),
  alternatives: z.array(DecisionAlternativeSchema).min(1).max(4),
  why: z.string().min(1).max(800),
  tradeoffs: DecisionTradeoffSchema.optional(),
  citations: z.array(z.string().min(1).max(200)).max(10).optional(),
});

export type ArchitectureDecisionData = z.infer<typeof ArchitectureDecisionDataSchema>;
