// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { TldrDataSchema, type TldrData } from './schema.ts';

export { TldrDataSchema, type TldrData, type TldrStat } from './schema.ts';

export const tldrSection: SectionType<TldrData> = {
  id: 'tldr',
  name: 'TL;DR',
  description:
    'Hero card with a one-sentence plain-English hook, a 2–3 sentence description, and 3–6 concrete stat cards. Required as the first section of every page.',
  applicableFor: ['repo', 'pr'],
  schema: TldrDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2000, tokensOut: 400 },
};

registerSection(tldrSection);
