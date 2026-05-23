// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { MermaidDiagramDataSchema, type MermaidDiagramData } from './schema.ts';

export { MermaidDiagramDataSchema, type MermaidDiagramData } from './schema.ts';

export const mermaidDiagramSection: SectionType<MermaidDiagramData> = {
  id: 'mermaid-diagram',
  name: 'Mermaid Diagram',
  description:
    'Client-side rendered Mermaid diagram. Use for flowcharts, sequences, state machines, class hierarchies, git history, or entity-relationships.',
  applicableFor: ['repo', 'pr'],
  schema: MermaidDiagramDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 1500, tokensOut: 300 },
};

registerSection(mermaidDiagramSection);
