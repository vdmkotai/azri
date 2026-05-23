// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { ComparisonTableDataSchema, type ComparisonTableData } from './schema.ts';

export {
  ComparisonTableDataSchema,
  type ComparisonRow,
  type ComparisonTableData,
} from './schema.ts';

export const comparisonTableSection: SectionType<ComparisonTableData> = {
  id: 'comparison-table',
  name: 'Comparison Table',
  description:
    'Side-by-side before/after or this/that comparison. Use for migrations, refactors, or "current vs proposed" trade-offs with optional per-row change tags.',
  applicableFor: ['repo', 'pr'],
  schema: ComparisonTableDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2200, tokensOut: 700 },
};

registerSection(comparisonTableSection);
