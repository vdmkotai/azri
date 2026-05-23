// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const EntityColorEnum = z.enum(['blue', 'purple', 'orange', 'green', 'pink', 'amber']);

export const EntitySchema = z.object({
  name: z.string().min(1).max(40),
  role: z.string().min(1).max(80),
  tech: z.string().min(1).max(40),
  description: z.string().min(1).max(280),
  color: EntityColorEnum,
});

export const EntityGridDataSchema = z.object({
  title: z.string().min(1).max(80),
  entities: z.array(EntitySchema).min(2).max(8),
});

export type EntityColor = z.infer<typeof EntityColorEnum>;
export type Entity = z.infer<typeof EntitySchema>;
export type EntityGridData = z.infer<typeof EntityGridDataSchema>;
