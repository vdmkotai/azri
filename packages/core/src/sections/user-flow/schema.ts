// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

const LucideIconNameSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z][a-z0-9-]*$/u, 'Lucide icon name must be lowercase kebab-case');

export const UserFlowStepSchema = z.object({
  number: z.number().int().min(1).max(99),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(280),
  icon: LucideIconNameSchema,
});

export const UserFlowDataSchema = z.object({
  title: z.string().min(1).max(120),
  steps: z.array(UserFlowStepSchema).min(3).max(8),
});

export type UserFlowStep = z.infer<typeof UserFlowStepSchema>;
export type UserFlowData = z.infer<typeof UserFlowDataSchema>;
