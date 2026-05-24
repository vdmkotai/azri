// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { GettingStartedDataSchema, type GettingStartedData } from './schema.ts';

export {
  GettingStartedDataSchema,
  GettingStartedPrereqSchema,
  GettingStartedStepSchema,
  type GettingStartedData,
  type GettingStartedPrereq,
  type GettingStartedStep,
} from './schema.ts';

export const gettingStartedSection: SectionType<GettingStartedData> = {
  id: 'getting-started',
  name: 'Getting started',
  description:
    'Prerequisites grid (with optional Simple Icons brand logos) plus a numbered list of copy-pastable setup commands. Use when the repo has a discoverable install / bootstrap flow in README, package.json scripts, or Dockerfile.',
  applicableFor: ['repo'],
  schema: GettingStartedDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2500, tokensOut: 700 },
};

registerSection(gettingStartedSection);
