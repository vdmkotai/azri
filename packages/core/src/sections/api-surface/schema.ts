// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const ApiMethodEnum = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const ApiEndpointSchema = z.object({
  method: ApiMethodEnum,
  path: z.string().min(1).max(160),
  purpose: z.string().min(1).max(200),
  auth: z.string().min(1).max(80).optional(),
});

export const ApiSurfaceDataSchema = z.object({
  title: z.string().min(1).max(80),
  endpoints: z.array(ApiEndpointSchema).min(1).max(20),
});

export type ApiMethod = z.infer<typeof ApiMethodEnum>;
export type ApiEndpoint = z.infer<typeof ApiEndpointSchema>;
export type ApiSurfaceData = z.infer<typeof ApiSurfaceDataSchema>;
