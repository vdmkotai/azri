// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { RiskCalloutDataSchema, type RiskCalloutData } from './schema.ts';

export {
  RiskCalloutDataSchema,
  RiskCalloutSeveritySchema,
  type RiskCalloutData,
  type RiskCalloutSeverity,
} from './schema.ts';

export const riskCalloutSection: SectionType<RiskCalloutData> = {
  id: 'risk-callout',
  name: 'Risk Callout',
  description:
    'Single severity-colored callout (info/warn/danger) for a focused risk, warning, or FYI with an optional suggestion. Use sparingly — one risk per callout.',
  applicableFor: ['repo', 'pr'],
  schema: RiskCalloutDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 1200, tokensOut: 300 },
};

registerSection(riskCalloutSection);
