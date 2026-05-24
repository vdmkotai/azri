// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const InvestigationVerdictSchema = z.enum(['confirmed', 'disproved', 'inconclusive']);

export const InvestigationHypothesisSchema = z.object({
  number: z.number().int().min(1).max(8),
  title: z.string().min(1).max(140),
  investigation: z.string().min(1).max(400),
  verdict: InvestigationVerdictSchema,
  evidence: z.string().min(1).max(400).optional(),
});

export type InvestigationHypothesis = z.infer<typeof InvestigationHypothesisSchema>;
export type InvestigationVerdict = z.infer<typeof InvestigationVerdictSchema>;

export const InvestigationDataSchema = z.object({
  title: z.string().min(1).max(140),
  hypotheses: z.array(InvestigationHypothesisSchema).min(2).max(8),
  conclusion: z.string().min(1).max(400),
});

export type InvestigationData = z.infer<typeof InvestigationDataSchema>;
