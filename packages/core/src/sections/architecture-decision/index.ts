// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { ArchitectureDecisionDataSchema, type ArchitectureDecisionData } from './schema.ts';

export { ArchitectureDecisionDataSchema, type ArchitectureDecisionData } from './schema.ts';

export const architectureDecisionSection: SectionType<ArchitectureDecisionData> = {
  id: 'architecture-decision',
  name: 'Architecture Decision',
  description:
    'Documents an intentional architectural choice: what was picked, alternatives rejected with reasons, why, and optional gain/cost tradeoffs.',
  applicableFor: ['repo', 'pr'],
  schema: ArchitectureDecisionDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 1800, tokensOut: 500 },
};

registerSection(architectureDecisionSection);
