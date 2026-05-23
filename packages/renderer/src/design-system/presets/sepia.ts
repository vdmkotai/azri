// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import {
  breakpoints,
  radii,
  shadows,
  type ColorTokens,
  type DesignSystem,
  type SpacingTokens,
} from '../tokens.ts';

const sepiaColors: ColorTokens = {
  text: '#5c4434',
  background: '#f4ecd8',
  accent: '#8b1a1a',
  severity: {
    info: '#3b5a7a',
    warn: '#a8731f',
    critical: '#8b1a1a',
  },
  bgCode: {
    background: '#e9dfc4',
    text: '#3a2a1e',
  },
};

const sepiaDarkColors: ColorTokens = {
  text: '#e8dcc5',
  background: '#2a2118',
  accent: '#e8a96b',
  severity: {
    info: '#9bb8d6',
    warn: '#e8b15a',
    critical: '#e89b7a',
  },
  bgCode: {
    background: '#1f1810',
    text: '#e8dcc5',
  },
};

const generousSpacing: SpacingTokens = {
  xs: 5,
  sm: 10,
  md: 14,
  lg: 19,
  xl: 29,
  '2xl': 38,
  '3xl': 58,
  '4xl': 77,
};

const garamondStack =
  '"EB Garamond", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

export const sepiaPreset: DesignSystem = {
  colors: sepiaColors,
  typefaces: {
    serif: garamondStack,
    mono: garamondStack,
  },
  spacing: generousSpacing,
  radii,
  shadows,
  breakpoints,
  darkColors: sepiaDarkColors,
};
