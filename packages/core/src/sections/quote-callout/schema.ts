// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const QuoteAttributionSchema = z.object({
  source: z.string().min(1).max(200),
  url: z.string().url().optional(),
});

export type QuoteAttribution = z.infer<typeof QuoteAttributionSchema>;

export const QuoteCalloutDataSchema = z.object({
  quote: z.string().min(1).max(600),
  attribution: QuoteAttributionSchema.optional(),
});

export type QuoteCalloutData = z.infer<typeof QuoteCalloutDataSchema>;
