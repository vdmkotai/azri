// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { RegressionRiskDataSchema, type RegressionRiskData } from './schema.ts';

export {
  RegressionRiskDataSchema,
  RegressionRiskEntrySchema,
  RegressionRiskSeveritySchema,
  type RegressionRiskData,
  type RegressionRiskEntry,
  type RegressionRiskSeverity,
} from './schema.ts';

export const regressionRiskSection: SectionType<RegressionRiskData> = {
  id: 'regression-risk',
  name: 'Regression Risk',
  description:
    'Severity-sorted list of regressions this PR could introduce, each with affected area, failure mode, and optional mitigation. Severity grading: critical (auth/payments/data), high (core feature), medium (adjacent), low (cosmetic).',
  applicableFor: ['pr'],
  schema: RegressionRiskDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2000, tokensOut: 700 },
};

registerSection(regressionRiskSection);
