// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const FeatureStatusSchema = z.enum(['shipped', 'beta', 'planned']);

const LucideIconNameSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z][a-z0-9-]*$/u, 'Lucide icon name must be lowercase kebab-case');

export const FeatureSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(280),
  status: FeatureStatusSchema,
  icon: LucideIconNameSchema,
});

export const FeatureListDataSchema = z.object({
  title: z.string().min(1).max(120),
  features: z.array(FeatureSchema).min(3).max(12),
});

export type FeatureStatus = z.infer<typeof FeatureStatusSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type FeatureListData = z.infer<typeof FeatureListDataSchema>;
