// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const StackCategoryEnum = z.enum([
  'Framework',
  'Auth',
  'Database',
  'Storage',
  'Compute',
  'UI',
  'Build',
  'Deploy',
  'Other',
]);

export const StackItemSchema = z.object({
  name: z.string().min(1).max(40),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(
      /^[a-z0-9-]+$/u,
      'Slug must be lowercase letters, digits, or hyphens (Simple Icons slug)',
    ),
  role: z.string().min(1).max(80),
  category: StackCategoryEnum,
});

export const StackGridDataSchema = z.object({
  title: z.string().min(1).max(60),
  items: z.array(StackItemSchema).min(3).max(12),
});

export type StackCategory = z.infer<typeof StackCategoryEnum>;
export type StackItem = z.infer<typeof StackItemSchema>;
export type StackGridData = z.infer<typeof StackGridDataSchema>;
