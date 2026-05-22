// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export { PROMPT_VERSION } from './version.ts';
export {
  ANTI_SLOP_FORBIDDEN_PHRASES,
  ANTI_SLOP_GUARD,
  ANTI_INJECTION_GUARD,
  buildSystemPrompt,
} from './guards.ts';

export { SYSTEM_PROMPT as STAGE_1_SUMMARIZE_PROMPT } from './system/stage-1-summarize.ts';
export { SYSTEM_PROMPT as STAGE_2_STRUCTURE_PROMPT } from './system/stage-2-structure.ts';
export { SYSTEM_PROMPT as SECTION_OVERVIEW_PROMPT } from './system/section-overview.ts';
export { SYSTEM_PROMPT as SECTION_NARRATIVE_PROMPT } from './system/section-narrative.ts';
export { SYSTEM_PROMPT as SECTION_ANNOTATED_DIFF_PROMPT } from './system/section-annotated-diff.ts';
export { SYSTEM_PROMPT as SECTION_MODULE_MAP_PROMPT } from './system/section-module-map.ts';
export { SYSTEM_PROMPT as SECTION_RISK_CALLOUTS_PROMPT } from './system/section-risk-callouts.ts';
export { SYSTEM_PROMPT as SECTION_TEST_IMPACT_PROMPT } from './system/section-test-impact.ts';
export { SYSTEM_PROMPT as SECTION_NEXT_STEPS_PROMPT } from './system/section-next-steps.ts';

import { SYSTEM_PROMPT as AD } from './system/section-annotated-diff.ts';
import { SYSTEM_PROMPT as MM } from './system/section-module-map.ts';
import { SYSTEM_PROMPT as NA } from './system/section-narrative.ts';
import { SYSTEM_PROMPT as NS } from './system/section-next-steps.ts';
import { SYSTEM_PROMPT as OV } from './system/section-overview.ts';
import { SYSTEM_PROMPT as RC } from './system/section-risk-callouts.ts';
import { SYSTEM_PROMPT as TI } from './system/section-test-impact.ts';

import type { SectionType } from '@azri/types';

export const SECTION_PROMPTS: Record<SectionType, string> = {
  overview: OV,
  narrative: NA,
  'annotated-diff': AD,
  'module-map': MM,
  'risk-callouts': RC,
  'test-impact': TI,
  'next-steps': NS,
};
