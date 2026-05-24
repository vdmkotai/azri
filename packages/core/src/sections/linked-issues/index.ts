// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { LinkedIssuesDataSchema, type LinkedIssuesData } from './schema.ts';

export {
  LinkedIssueEntrySchema,
  LinkedIssueRelationEnum,
  LinkedIssueStatusEnum,
  LinkedIssuesDataSchema,
  type LinkedIssueEntry,
  type LinkedIssueRelation,
  type LinkedIssueStatus,
  type LinkedIssuesData,
} from './schema.ts';

export const linkedIssuesSection: SectionType<LinkedIssuesData> = {
  id: 'linked-issues',
  name: 'Linked issues',
  description:
    'Grid of GitHub issues this PR references via Closes/Fixes/Refs/Blocks keywords in body or commits. Each card shows relation badge, status pill, issue number, and title; clicking opens the issue. PR-only.',
  applicableFor: ['pr'],
  schema: LinkedIssuesDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 1800, tokensOut: 400 },
};

registerSection(linkedIssuesSection);
