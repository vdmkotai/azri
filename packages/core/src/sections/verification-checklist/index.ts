// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { VerificationChecklistDataSchema, type VerificationChecklistData } from './schema.ts';

export {
  VerificationChecklistDataSchema,
  VerificationChecklistItemSchema,
  type VerificationChecklistData,
  type VerificationChecklistItem,
} from './schema.ts';

export const verificationChecklistSection: SectionType<VerificationChecklistData> = {
  id: 'verification-checklist',
  name: 'Verification checklist',
  description:
    'Checklist of what was verified for this PR: manual tests, automated tests, edge cases, deployment validation. Each item shows verified/unverified state plus optional method. PR-only.',
  applicableFor: ['pr'],
  schema: VerificationChecklistDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2000, tokensOut: 500 },
};

registerSection(verificationChecklistSection);
