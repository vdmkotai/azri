// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const ProjectOverviewPersonaSchema = z.object({
  name: z.string().min(1).max(60),
  motivation: z.string().min(1).max(200),
});

export const ProjectOverviewDataSchema = z.object({
  headline: z.string().min(1).max(200),
  description: z.string().min(1).max(800),
  personas: z.array(ProjectOverviewPersonaSchema).min(1).max(4),
});

export type ProjectOverviewPersona = z.infer<typeof ProjectOverviewPersonaSchema>;
export type ProjectOverviewData = z.infer<typeof ProjectOverviewDataSchema>;
