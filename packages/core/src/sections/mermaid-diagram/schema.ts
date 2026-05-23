// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const MermaidDiagramKindSchema = z.enum([
  'flowchart',
  'sequence',
  'state',
  'class',
  'git',
  'er',
]);

export type MermaidDiagramKind = z.infer<typeof MermaidDiagramKindSchema>;

export const MermaidDiagramDataSchema = z.object({
  title: z.string().min(1).max(140),
  source: z.string().min(1),
  caption: z.string().min(1).max(280).optional(),
  kind: MermaidDiagramKindSchema,
});

export type MermaidDiagramData = z.infer<typeof MermaidDiagramDataSchema>;
