// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { DataTableDataSchema, type DataTableData } from './schema.ts';

export { DataTableDataSchema, type DataTableColumn, type DataTableData } from './schema.ts';

export const dataTableSection: SectionType<DataTableData> = {
  id: 'data-table',
  name: 'Data Table',
  description:
    'Generic structured tabular data with configurable columns. Use when input has list-of-objects shape (API endpoints, DB tables, file inventories, config matrices).',
  applicableFor: ['repo', 'pr'],
  schema: DataTableDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2500, tokensOut: 800 },
};

registerSection(dataTableSection);
