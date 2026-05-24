// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const BeforeAfterFlowDataSchema = z.object({
  title: z.string().min(1).max(140),
  beforeMermaid: z.string().min(1),
  afterMermaid: z.string().min(1),
  diffSummary: z.string().min(1).max(400),
});

export type BeforeAfterFlowData = z.infer<typeof BeforeAfterFlowDataSchema>;
