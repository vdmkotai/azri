// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { TestImpactDataSchema, type TestImpactData } from './schema.ts';

export {
  TestImpactDataSchema,
  TestAddedEntrySchema,
  TestChangedEntrySchema,
  TestUncoveredSchema,
  type TestImpactData,
  type TestAddedEntry,
  type TestChangedEntry,
  type TestUncovered,
} from './schema.ts';

export const testImpactSection: SectionType<TestImpactData> = {
  id: 'test-impact',
  name: 'Test Impact',
  description:
    'Summarizes test changes in a PR: tests added (success-themed) vs tests modified (warn-themed), plus an optional callout for production areas shipped without matching coverage.',
  applicableFor: ['pr'],
  schema: TestImpactDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 1800, tokensOut: 600 },
};

registerSection(testImpactSection);
