// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const LinkCalloutKindSchema = z.enum(['docs', 'issue', 'pr', 'article', 'tool', 'repo']);

export const LinkCalloutDataSchema = z.object({
  url: z.string().url().startsWith('https://'),
  title: z.string().min(1),
  description: z.string().min(1),
  kind: LinkCalloutKindSchema.optional(),
});

export type LinkCalloutKind = z.infer<typeof LinkCalloutKindSchema>;
export type LinkCalloutData = z.infer<typeof LinkCalloutDataSchema>;
