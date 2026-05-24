// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const AnnotatedDiffHunkSchema = z.object({
  filePath: z.string().min(1).max(400),
  lineRange: z.string().regex(/^\d+-\d+$/u, 'lineRange must look like "42-87"'),
  language: z.string().min(1).max(32),
  code: z.string().min(1),
  annotation: z.string().min(1).max(400),
});

export const AnnotatedDiffDataSchema = z.object({
  title: z.string().min(1).max(140),
  hunks: z.array(AnnotatedDiffHunkSchema).min(1).max(5),
});

export type AnnotatedDiffHunk = z.infer<typeof AnnotatedDiffHunkSchema>;
export type AnnotatedDiffData = z.infer<typeof AnnotatedDiffDataSchema>;
