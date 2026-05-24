// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { BeforeAfterFlowDataSchema, type BeforeAfterFlowData } from './schema.ts';

export { BeforeAfterFlowDataSchema, type BeforeAfterFlowData } from './schema.ts';

export const beforeAfterFlowSection: SectionType<BeforeAfterFlowData> = {
  id: 'before-after-flow',
  name: 'Before / After Flow',
  description:
    'Side-by-side Mermaid diagrams comparing the flow before and after this PR, plus a plain-English diff summary. Use for refactors / restructures.',
  applicableFor: ['pr'],
  schema: BeforeAfterFlowDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2200, tokensOut: 600 },
};

registerSection(beforeAfterFlowSection);
