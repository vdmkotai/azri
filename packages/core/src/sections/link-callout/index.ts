// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { LinkCalloutDataSchema, type LinkCalloutData } from './schema.ts';

export {
  LinkCalloutDataSchema,
  LinkCalloutKindSchema,
  type LinkCalloutData,
  type LinkCalloutKind,
} from './schema.ts';

export const linkCalloutSection: SectionType<LinkCalloutData> = {
  id: 'link-callout',
  name: 'Link Callout',
  description:
    'External resource link card with type-specific icon (docs/issue/pr/article/tool/repo). Use to anchor narrative claims to authoritative sources.',
  applicableFor: ['repo', 'pr'],
  schema: LinkCalloutDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 1000, tokensOut: 250 },
};

registerSection(linkCalloutSection);
