// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { RollbackPlanDataSchema, type RollbackPlanData } from './schema.ts';

export {
  RollbackComplexityEnum,
  RollbackDataMigrationSchema,
  RollbackPlanDataSchema,
  RollbackStepSchema,
  type RollbackComplexity,
  type RollbackDataMigration,
  type RollbackPlanData,
  type RollbackStep,
} from './schema.ts';

export const rollbackPlanSection: SectionType<RollbackPlanData> = {
  id: 'rollback-plan',
  name: 'Rollback plan',
  description:
    'Numbered command-based steps to undo this PR in production, with complexity rating (simple/moderate/complex), optional warnings, and optional data-migration notes flagging irreversible changes. PR-only.',
  applicableFor: ['pr'],
  schema: RollbackPlanDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2400, tokensOut: 700 },
};

registerSection(rollbackPlanSection);
