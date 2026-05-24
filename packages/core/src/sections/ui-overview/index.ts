// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { UiOverviewDataSchema, type UiOverviewData } from './schema.ts';

export {
  UiOverviewDataSchema,
  UiRegionSchema,
  type UiOverviewData,
  type UiRegion,
} from './schema.ts';

export const uiOverviewSection: SectionType<UiOverviewData> = {
  id: 'ui-overview',
  name: 'UI overview',
  description:
    'Spatial breakdown of the UI surface: 2-8 named regions (sidebar, header, modal, etc.) each with role and contents, plus an optional ASCII / box-drawing wireframe mockup.',
  applicableFor: ['repo'],
  schema: UiOverviewDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2400, tokensOut: 700 },
};

registerSection(uiOverviewSection);
