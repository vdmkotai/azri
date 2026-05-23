// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { QuoteCalloutDataSchema, type QuoteCalloutData } from './schema.ts';

export { QuoteCalloutDataSchema, type QuoteCalloutData } from './schema.ts';

export const quoteCalloutSection: SectionType<QuoteCalloutData> = {
  id: 'quote-callout',
  name: 'Quote Callout',
  description:
    'Highlights a memorable statement, design principle, or quote from the source material, with optional attribution to a source file, doc, or person.',
  applicableFor: ['repo', 'pr'],
  schema: QuoteCalloutDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 1200, tokensOut: 200 },
};

registerSection(quoteCalloutSection);
