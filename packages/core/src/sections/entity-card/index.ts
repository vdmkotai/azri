// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { EntityCardDataSchema, type EntityCardData } from './schema.ts';

export {
  EntityCardDataSchema,
  EntityColorEnum,
  EntityDetailSchema,
  EntitySubSectionSchema,
  type EntityCardData,
  type EntityColor,
  type EntityDetail,
  type EntitySubSection,
} from './schema.ts';

export const entityCardSection: SectionType<EntityCardData> = {
  id: 'entity-card',
  name: 'Entity card',
  description:
    'Detail variant of the entity-grid for a SINGLE high-importance entity. Color-coded stripe + tech tag + multiple sub-sections (data model, lifecycle, failure modes, etc.). Use when one entity needs more depth than a grid cell allows.',
  applicableFor: ['repo', 'pr'],
  schema: EntityCardDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2500, tokensOut: 900 },
};

registerSection(entityCardSection);
