// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const DataFlowStepSchema = z.object({
  number: z.number().int().min(1).max(99),
  action: z.string().min(1).max(240),
});

export const DataFlowDiagramDataSchema = z.object({
  title: z.string().min(1).max(140),
  mermaidSource: z.string().min(1),
  steps: z.array(DataFlowStepSchema).min(3).max(10),
  notes: z.string().min(1).max(600).optional(),
});

export type DataFlowStep = z.infer<typeof DataFlowStepSchema>;
export type DataFlowDiagramData = z.infer<typeof DataFlowDiagramDataSchema>;
