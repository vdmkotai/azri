// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { ReviewerGuideDataSchema, type ReviewerGuideData } from './schema.ts';

export {
  ReviewerGuideDataSchema,
  ReviewerGuidePrioritySchema,
  type ReviewerGuideData,
  type ReviewerGuidePriority,
} from './schema.ts';

export const reviewerGuideSection: SectionType<ReviewerGuideData> = {
  id: 'reviewer-guide',
  name: 'Reviewer guide',
  description:
    'Ranked 2-6 priorities for a code reviewer: highest-judgement areas first. Each priority has a rank badge, area name, what-to-check directive, and the specific files to open. PR-only.',
  applicableFor: ['pr'],
  schema: ReviewerGuideDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2200, tokensOut: 600 },
};

registerSection(reviewerGuideSection);
