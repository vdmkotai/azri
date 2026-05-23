// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { CodeWalkthroughDataSchema, type CodeWalkthroughData } from './schema.ts';

export { CodeWalkthroughDataSchema, type CodeWalkthroughData } from './schema.ts';

export const codeWalkthroughSection: SectionType<CodeWalkthroughData> = {
  id: 'code-walkthrough',
  name: 'Code Walkthrough',
  description:
    'A code snippet (max 40 lines) with 1-6 inline annotations explaining what matters. Use when teaching a pattern through a real example.',
  applicableFor: ['repo', 'pr'],
  schema: CodeWalkthroughDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2000, tokensOut: 500 },
};

registerSection(codeWalkthroughSection);
