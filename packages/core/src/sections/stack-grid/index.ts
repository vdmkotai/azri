// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { StackGridDataSchema, type StackGridData } from './schema.ts';

export {
  StackCategoryEnum,
  StackGridDataSchema,
  StackItemSchema,
  type StackCategory,
  type StackGridData,
  type StackItem,
} from './schema.ts';

export const stackGridSection: SectionType<StackGridData> = {
  id: 'stack-grid',
  name: 'Stack grid',
  description:
    'Brand-icon grid of technologies used in the project. Each card shows a Simple Icons logo, the tech name, a short role, and a category pill. Use to surface frameworks, auth, databases, infra at a glance.',
  applicableFor: ['repo', 'pr'],
  schema: StackGridDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2000, tokensOut: 600 },
};

registerSection(stackGridSection);
