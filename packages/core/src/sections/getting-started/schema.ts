// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const GettingStartedPrereqSchema = z.object({
  tool: z.string().min(1).max(40),
  version: z.string().min(1).max(40).optional(),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/u, 'Slug must be lowercase letters, digits, or hyphens (Simple Icons)')
    .optional(),
});

export const GettingStartedStepSchema = z.object({
  command: z.string().min(1).max(240),
  description: z.string().min(1).max(200),
});

export const GettingStartedDataSchema = z.object({
  title: z.string().min(1).max(80),
  prereqs: z.array(GettingStartedPrereqSchema).min(1).max(6),
  steps: z.array(GettingStartedStepSchema).min(2).max(8),
});

export type GettingStartedPrereq = z.infer<typeof GettingStartedPrereqSchema>;
export type GettingStartedStep = z.infer<typeof GettingStartedStepSchema>;
export type GettingStartedData = z.infer<typeof GettingStartedDataSchema>;
