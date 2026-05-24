// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const ReviewerGuidePrioritySchema = z.object({
  rank: z.number().int().positive().max(6),
  area: z.string().min(1).max(80),
  what_to_check: z.string().min(1).max(400),
  files: z.array(z.string().min(1).max(240)).min(1).max(5),
});

export const ReviewerGuideDataSchema = z.object({
  title: z.string().min(1).max(80),
  priorities: z.array(ReviewerGuidePrioritySchema).min(2).max(6),
});

export type ReviewerGuidePriority = z.infer<typeof ReviewerGuidePrioritySchema>;
export type ReviewerGuideData = z.infer<typeof ReviewerGuideDataSchema>;
