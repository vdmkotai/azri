// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const LinkedIssueStatusEnum = z.enum(['open', 'closed', 'merged']);
export const LinkedIssueRelationEnum = z.enum(['closes', 'fixes', 'references', 'blocks']);

export const LinkedIssueEntrySchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1).max(240),
  url: z.string().url().startsWith('https://'),
  status: LinkedIssueStatusEnum,
  relation: LinkedIssueRelationEnum,
});

export const LinkedIssuesDataSchema = z.object({
  title: z.string().min(1).max(80),
  issues: z.array(LinkedIssueEntrySchema).min(1).max(6),
});

export type LinkedIssueStatus = z.infer<typeof LinkedIssueStatusEnum>;
export type LinkedIssueRelation = z.infer<typeof LinkedIssueRelationEnum>;
export type LinkedIssueEntry = z.infer<typeof LinkedIssueEntrySchema>;
export type LinkedIssuesData = z.infer<typeof LinkedIssuesDataSchema>;
