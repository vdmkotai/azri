// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { MigrationNotesDataSchema, type MigrationNotesData } from './schema.ts';

export {
  MigrationNotesDataSchema,
  BreakingChangeSchema,
  DeprecationSchema,
  type MigrationNotesData,
  type BreakingChange,
  type Deprecation,
} from './schema.ts';

export const migrationNotesSection: SectionType<MigrationNotesData> = {
  id: 'migration-notes',
  name: 'Migration Notes',
  description:
    'Breaking-change migration guide for a PR. Each breaking change shows before/after code blocks side-by-side and numbered migration steps. Optional softer deprecations list. Renders empty when isBreaking is false and no deprecations.',
  applicableFor: ['pr'],
  schema: MigrationNotesDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2400, tokensOut: 1000 },
};

registerSection(migrationNotesSection);
