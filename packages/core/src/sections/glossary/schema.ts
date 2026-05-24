// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const GlossaryTermSchema = z.object({
  term: z.string().min(1).max(60),
  definition: z.string().min(1).max(400),
  seeAlso: z.array(z.string().min(1).max(60)).max(5).optional(),
});

export const GlossaryDataSchema = z.object({
  title: z.string().min(1).max(80),
  terms: z.array(GlossaryTermSchema).min(3).max(20),
});

export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;
export type GlossaryData = z.infer<typeof GlossaryDataSchema>;
