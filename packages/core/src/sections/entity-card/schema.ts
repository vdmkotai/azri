// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const EntityColorEnum = z.enum(['blue', 'purple', 'orange', 'green', 'pink', 'amber']);

export const EntityDetailSchema = z.object({
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(100),
  tech: z.string().min(1).max(60),
  description: z.string().min(1).max(400),
  color: EntityColorEnum,
});

export const EntitySubSectionSchema = z.object({
  heading: z.string().min(1).max(80),
  body: z.string().min(1).max(600),
});

export const EntityCardDataSchema = z.object({
  entity: EntityDetailSchema,
  sections: z.array(EntitySubSectionSchema).min(1).max(4),
});

export type EntityColor = z.infer<typeof EntityColorEnum>;
export type EntityDetail = z.infer<typeof EntityDetailSchema>;
export type EntitySubSection = z.infer<typeof EntitySubSectionSchema>;
export type EntityCardData = z.infer<typeof EntityCardDataSchema>;
