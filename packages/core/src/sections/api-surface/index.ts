// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { ApiSurfaceDataSchema, type ApiSurfaceData } from './schema.ts';

export {
  ApiEndpointSchema,
  ApiMethodEnum,
  ApiSurfaceDataSchema,
  type ApiEndpoint,
  type ApiMethod,
  type ApiSurfaceData,
} from './schema.ts';

export const apiSurfaceSection: SectionType<ApiSurfaceData> = {
  id: 'api-surface',
  name: 'API surface',
  description:
    'Table of HTTP endpoints (REST / RPC) with color-coded method pills, path, one-sentence purpose, and optional auth requirement. Use when the repo exposes server-side routes (Next.js route handlers, Express / Hono / Elysia / Fastify, FastAPI / Flask, Rails routes, tRPC, etc.).',
  applicableFor: ['repo'],
  schema: ApiSurfaceDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 3000, tokensOut: 1000 },
};

registerSection(apiSurfaceSection);
