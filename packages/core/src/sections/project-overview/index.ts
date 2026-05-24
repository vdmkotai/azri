// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { ProjectOverviewDataSchema, type ProjectOverviewData } from './schema.ts';

export {
  ProjectOverviewDataSchema,
  ProjectOverviewPersonaSchema,
  type ProjectOverviewData,
  type ProjectOverviewPersona,
} from './schema.ts';

export const projectOverviewSection: SectionType<ProjectOverviewData> = {
  id: 'project-overview',
  name: 'Project overview',
  description:
    'Hero block answering "what is this repo and who is it for". Plain-English headline, 3-5 sentence description, and 1-4 user persona pills.',
  applicableFor: ['repo'],
  schema: ProjectOverviewDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2200, tokensOut: 500 },
};

registerSection(projectOverviewSection);
