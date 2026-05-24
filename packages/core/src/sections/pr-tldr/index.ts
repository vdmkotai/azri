// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { PrTldrDataSchema, type PrTldrData } from './schema.ts';

export {
  PrTldrDataSchema,
  PrTldrImpactSchema,
  PrTldrStatsSchema,
  type PrTldrData,
  type PrTldrImpact,
  type PrTldrStats,
} from './schema.ts';

export const prTldrSection: SectionType<PrTldrData> = {
  id: 'pr-tldr',
  name: 'PR TL;DR',
  description:
    'Hero card for a pull request: what it does, why, impact tier, and optional change stats. Required as the first section of every PR page.',
  applicableFor: ['pr'],
  schema: PrTldrDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2000, tokensOut: 350 },
};

registerSection(prTldrSection);
