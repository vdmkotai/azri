// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const CodeWalkthroughAnnotationSchema = z.object({
  lineOffset: z.number().int().min(0),
  text: z.string().min(1).max(400),
});

export type CodeWalkthroughAnnotation = z.infer<typeof CodeWalkthroughAnnotationSchema>;

export const CodeWalkthroughDataSchema = z.object({
  title: z.string().min(1).max(140),
  filePath: z.string().min(1).max(400),
  lineRange: z
    .string()
    .regex(/^\d+-\d+$/u, 'lineRange must look like "42-87"')
    .optional(),
  language: z.string().min(1).max(32),
  code: z.string().min(1),
  annotations: z.array(CodeWalkthroughAnnotationSchema).min(1).max(6),
});

export type CodeWalkthroughData = z.infer<typeof CodeWalkthroughDataSchema>;
