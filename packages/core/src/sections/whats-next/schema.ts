// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const WhatsNextCommitSchema = z.object({
  sha: z
    .string()
    .min(7)
    .max(40)
    .regex(/^[0-9a-f]+$/u, 'sha must be lowercase hex'),
  message: z.string().min(1).max(200),
  author: z.string().min(1).max(80).optional(),
  date: z.string().min(1).max(40).optional(),
});

export const WhatsNextOpenPrSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1).max(200),
  status: z.string().min(1).max(40),
});

export const WhatsNextPlannedWorkSchema = z.object({
  title: z.string().min(1).max(200),
  source: z.string().min(1).max(120),
});

export const WhatsNextDataSchema = z.object({
  title: z.string().min(1).max(80),
  recentCommits: z.array(WhatsNextCommitSchema).min(0).max(10),
  openPRs: z.array(WhatsNextOpenPrSchema).min(0).max(5).optional(),
  plannedWork: z.array(WhatsNextPlannedWorkSchema).min(0).max(5).optional(),
});

export type WhatsNextCommit = z.infer<typeof WhatsNextCommitSchema>;
export type WhatsNextOpenPr = z.infer<typeof WhatsNextOpenPrSchema>;
export type WhatsNextPlannedWork = z.infer<typeof WhatsNextPlannedWorkSchema>;
export type WhatsNextData = z.infer<typeof WhatsNextDataSchema>;
