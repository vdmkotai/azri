// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { DeploymentMapDataSchema, type DeploymentMapData } from './schema.ts';

export {
  DeploymentEntrySchema,
  DeploymentHostEnum,
  DeploymentMapDataSchema,
  type DeploymentEntry,
  type DeploymentHost,
  type DeploymentMapData,
} from './schema.ts';

export const deploymentMapSection: SectionType<DeploymentMapData> = {
  id: 'deployment-map',
  name: 'Deployment map',
  description:
    'Grid of deployment targets with brand icons (Simple Icons CDN). Shows where each component runs (Vercel, Railway, Fly.io, Cloudflare, AWS, GCP, self-hosted, CDN). Repo-only.',
  applicableFor: ['repo'],
  schema: DeploymentMapDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2000, tokensOut: 500 },
};

registerSection(deploymentMapSection);
