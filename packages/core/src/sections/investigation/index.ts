// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { InvestigationDataSchema, type InvestigationData } from './schema.ts';

export {
  InvestigationDataSchema,
  InvestigationHypothesisSchema,
  InvestigationVerdictSchema,
  type InvestigationData,
  type InvestigationHypothesis,
  type InvestigationVerdict,
} from './schema.ts';

export const investigationSection: SectionType<InvestigationData> = {
  id: 'investigation',
  name: 'Investigation',
  description:
    'Reconstructs the debugging journey behind a PR: an ordered timeline of 2-8 hypotheses with verdicts (confirmed/disproved/inconclusive) and a closing conclusion. Sourced from PR body, commits, or linked issues.',
  applicableFor: ['pr'],
  schema: InvestigationDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2000, tokensOut: 700 },
};

registerSection(investigationSection);
