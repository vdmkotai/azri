// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

const SpacingPartialSchema = z
  .object({
    xs: z.number().optional(),
    sm: z.number().optional(),
    md: z.number().optional(),
    lg: z.number().optional(),
    xl: z.number().optional(),
    '2xl': z.number().optional(),
    '3xl': z.number().optional(),
    '4xl': z.number().optional(),
  })
  .optional();

const RadiiPartialSchema = z
  .object({
    sm: z.number().optional(),
    md: z.number().optional(),
    lg: z.number().optional(),
  })
  .optional();

const ShadowsPartialSchema = z
  .object({
    subtle: z.string().optional(),
    lifted: z.string().optional(),
  })
  .optional();

export const DesignTokensSchema = z.object({
  colors: z
    .object({
      text: z.string().optional(),
      background: z.string().optional(),
      accent: z.string().optional(),
      severity: z
        .object({
          info: z.string().optional(),
          warn: z.string().optional(),
          critical: z.string().optional(),
        })
        .optional(),
      bgCode: z
        .object({
          background: z.string().optional(),
          text: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  typefaces: z
    .object({
      serif: z.string().optional(),
      mono: z.string().optional(),
    })
    .optional(),
  spacing: SpacingPartialSchema,
  radii: RadiiPartialSchema,
  shadows: ShadowsPartialSchema,
  allowEmoji: z.boolean().optional(),
});

export const UserTokensSchema = DesignTokensSchema.omit({ allowEmoji: true });
