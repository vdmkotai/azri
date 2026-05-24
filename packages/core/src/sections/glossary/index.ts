// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { GlossaryDataSchema, type GlossaryData } from './schema.ts';

export {
  GlossaryDataSchema,
  GlossaryTermSchema,
  type GlossaryData,
  type GlossaryTerm,
} from './schema.ts';

export const glossarySection: SectionType<GlossaryData> = {
  id: 'glossary',
  name: 'Glossary',
  description:
    'Alphabetically sorted two-column definition list for 3-20 domain-specific terms a newcomer would need to look up. Each entry has a mono-styled term, a plain-English definition, and optional "see also" chips for related terms.',
  applicableFor: ['repo'],
  schema: GlossaryDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 3000, tokensOut: 1200 },
};

registerSection(glossarySection);
