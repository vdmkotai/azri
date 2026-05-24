// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { WhatsNextDataSchema, type WhatsNextData } from './schema.ts';

export {
  WhatsNextCommitSchema,
  WhatsNextDataSchema,
  WhatsNextOpenPrSchema,
  WhatsNextPlannedWorkSchema,
  type WhatsNextCommit,
  type WhatsNextData,
  type WhatsNextOpenPr,
  type WhatsNextPlannedWork,
} from './schema.ts';

export const whatsNextSection: SectionType<WhatsNextData> = {
  id: 'whats-next',
  name: "What's next",
  description:
    'Three-column section showing project momentum: recent commit timeline, open PR cards, and planned work cards sourced from .sisyphus/plans, TODO.md, or ROADMAP.md. Hides itself entirely when all three sources are empty.',
  applicableFor: ['repo'],
  schema: WhatsNextDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2500, tokensOut: 900 },
};

registerSection(whatsNextSection);
