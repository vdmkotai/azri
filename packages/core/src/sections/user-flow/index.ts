// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { UserFlowDataSchema, type UserFlowData } from './schema.ts';

export {
  UserFlowDataSchema,
  UserFlowStepSchema,
  type UserFlowData,
  type UserFlowStep,
} from './schema.ts';

export const userFlowSection: SectionType<UserFlowData> = {
  id: 'user-flow',
  name: 'User flow',
  description:
    'Vertical numbered timeline of the user journey, 3-8 ordered steps from entry to value. Each step has a Lucide icon, action-led title, and short description.',
  applicableFor: ['repo'],
  schema: UserFlowDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2200, tokensOut: 600 },
};

registerSection(userFlowSection);
