// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

export const TldrStatSchema = z.object({
  label: z.string().min(1).max(40),
  value: z.string().min(1).max(40),
  hint: z.string().min(1).max(80).optional(),
});

export const TldrDataSchema = z.object({
  hook: z.string().min(1).max(160),
  description: z.string().min(1).max(400),
  stats: z.array(TldrStatSchema).min(3).max(6),
});

export type TldrStat = z.infer<typeof TldrStatSchema>;
export type TldrData = z.infer<typeof TldrDataSchema>;
