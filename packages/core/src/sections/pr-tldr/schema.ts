// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const PrTldrImpactSchema = z.enum(['major', 'minor', 'patch', 'internal']);

export const PrTldrStatsSchema = z.object({
  filesChanged: z.number().int().min(0),
  additions: z.number().int().min(0),
  deletions: z.number().int().min(0),
});

export const PrTldrDataSchema = z.object({
  what: z.string().min(1).max(200),
  why: z.string().min(1).max(400),
  impact: PrTldrImpactSchema,
  stats: PrTldrStatsSchema.optional(),
});

export type PrTldrImpact = z.infer<typeof PrTldrImpactSchema>;
export type PrTldrStats = z.infer<typeof PrTldrStatsSchema>;
export type PrTldrData = z.infer<typeof PrTldrDataSchema>;
