// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { ChangeSummaryDataSchema, type ChangeSummaryData } from './schema.ts';

export {
  ChangeSummaryDataSchema,
  ChangeSummaryFileKindSchema,
  ChangeSummaryFileSchema,
  ChangeSummaryGroupSchema,
  type ChangeSummaryData,
  type ChangeSummaryFile,
  type ChangeSummaryFileKind,
  type ChangeSummaryGroup,
} from './schema.ts';

export const changeSummarySection: SectionType<ChangeSummaryData> = {
  id: 'change-summary',
  name: 'Change Summary',
  description:
    'Files in this PR grouped by module / concern, each group with a one-sentence rationale and a kind-tagged file table.',
  applicableFor: ['pr'],
  schema: ChangeSummaryDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2500, tokensOut: 700 },
};

registerSection(changeSummarySection);
