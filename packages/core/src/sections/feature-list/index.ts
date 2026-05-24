// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { FeatureListDataSchema, type FeatureListData } from './schema.ts';

export {
  FeatureListDataSchema,
  FeatureSchema,
  FeatureStatusSchema,
  type Feature,
  type FeatureListData,
  type FeatureStatus,
} from './schema.ts';

export const featureListSection: SectionType<FeatureListData> = {
  id: 'feature-list',
  name: 'Feature list',
  description:
    'Card grid of 3-12 distinct user-visible product features. Each card has a Lucide icon, name, description, and status pill (shipped / beta / planned).',
  applicableFor: ['repo'],
  schema: FeatureListDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2400, tokensOut: 900 },
};

registerSection(featureListSection);
