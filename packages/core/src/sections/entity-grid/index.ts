// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { EntityGridDataSchema, type EntityGridData } from './schema.ts';

export {
  EntityColorEnum,
  EntityGridDataSchema,
  EntitySchema,
  type Entity,
  type EntityColor,
  type EntityGridData,
} from './schema.ts';

export const entityGridSection: SectionType<EntityGridData> = {
  id: 'entity-grid',
  name: 'Entity grid',
  description:
    'Color-coded cards (Balance "Cast of Characters" style) for 2–8 key system components. Each entity gets a stripe color, role, primary tech, and short description; colors carry through to other sections so the reader can track entities.',
  applicableFor: ['repo', 'pr'],
  schema: EntityGridDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2500, tokensOut: 700 },
};

registerSection(entityGridSection);
