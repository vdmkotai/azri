// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const DeploymentHostEnum = z.enum([
  'vercel',
  'railway',
  'flyio',
  'cloudflare',
  'aws',
  'gcp',
  'self-hosted',
  'cdn',
  'other',
]);

export const DeploymentEntrySchema = z.object({
  component: z.string().min(1).max(60),
  runtime: z.string().min(1).max(60),
  host: DeploymentHostEnum,
  url: z.string().url().max(240).optional(),
  region: z.string().min(1).max(60).optional(),
  notes: z.string().min(1).max(240).optional(),
});

export const DeploymentMapDataSchema = z.object({
  title: z.string().min(1).max(80),
  deployments: z.array(DeploymentEntrySchema).min(1).max(10),
});

export type DeploymentHost = z.infer<typeof DeploymentHostEnum>;
export type DeploymentEntry = z.infer<typeof DeploymentEntrySchema>;
export type DeploymentMapData = z.infer<typeof DeploymentMapDataSchema>;
