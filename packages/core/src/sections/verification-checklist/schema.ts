// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const VerificationChecklistItemSchema = z.object({
  description: z.string().min(1).max(240),
  verified: z.boolean(),
  method: z.string().min(1).max(240).optional(),
});

export const VerificationChecklistDataSchema = z.object({
  title: z.string().min(1).max(80),
  items: z.array(VerificationChecklistItemSchema).min(2).max(10),
});

export type VerificationChecklistItem = z.infer<typeof VerificationChecklistItemSchema>;
export type VerificationChecklistData = z.infer<typeof VerificationChecklistDataSchema>;
