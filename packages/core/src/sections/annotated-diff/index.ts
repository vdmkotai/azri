// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { AnnotatedDiffDataSchema, type AnnotatedDiffData } from './schema.ts';

export {
  AnnotatedDiffDataSchema,
  AnnotatedDiffHunkSchema,
  type AnnotatedDiffData,
  type AnnotatedDiffHunk,
} from './schema.ts';

export const annotatedDiffSection: SectionType<AnnotatedDiffData> = {
  id: 'annotated-diff',
  name: 'Annotated Diff',
  description:
    'Cherry-picked 1-5 most illustrative code hunks from the PR, each with a unified-diff snippet (+/-/space markers) and a 1-2 sentence annotation.',
  applicableFor: ['pr'],
  schema: AnnotatedDiffDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 3000, tokensOut: 800 },
};

registerSection(annotatedDiffSection);
