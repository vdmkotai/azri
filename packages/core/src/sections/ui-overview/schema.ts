// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const UiRegionSchema = z.object({
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(120),
  contents: z.string().min(1).max(400),
});

export const UiOverviewDataSchema = z.object({
  title: z.string().min(1).max(120),
  regions: z.array(UiRegionSchema).min(2).max(8),
  mockupAscii: z.string().min(1).max(4000).optional(),
});

export type UiRegion = z.infer<typeof UiRegionSchema>;
export type UiOverviewData = z.infer<typeof UiOverviewDataSchema>;
