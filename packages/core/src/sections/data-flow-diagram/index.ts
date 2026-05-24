// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { DataFlowDiagramDataSchema, type DataFlowDiagramData } from './schema.ts';

export {
  DataFlowDiagramDataSchema,
  DataFlowStepSchema,
  type DataFlowDiagramData,
  type DataFlowStep,
} from './schema.ts';

export const dataFlowDiagramSection: SectionType<DataFlowDiagramData> = {
  id: 'data-flow-diagram',
  name: 'Data flow diagram',
  description:
    'Mermaid flow diagram paired with a numbered step-by-step explanation. Use to show how a real request, event, or piece of data traverses the system end-to-end. Repo-only.',
  applicableFor: ['repo'],
  schema: DataFlowDiagramDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2200, tokensOut: 500 },
};

registerSection(dataFlowDiagramSection);
