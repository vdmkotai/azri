// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import {
  breakpoints,
  spacing,
  type ColorTokens,
  type DesignSystem,
  type RadiiTokens,
  type ShadowTokens,
} from '../tokens.ts';

const brutalistColors: ColorTokens = {
  text: '#000000',
  background: '#ffffff',
  accent: '#000000',
  severity: {
    info: '#000000',
    warn: '#000000',
    critical: '#000000',
  },
  bgCode: {
    background: '#000000',
    text: '#ffffff',
  },
};

const brutalistDarkColors: ColorTokens = {
  text: '#ffffff',
  background: '#000000',
  accent: '#ffffff',
  severity: {
    info: '#ffffff',
    warn: '#ffffff',
    critical: '#ffffff',
  },
  bgCode: {
    background: '#ffffff',
    text: '#000000',
  },
};

const flatRadii: RadiiTokens = { sm: 0, md: 0, lg: 0 };
const flatShadows: ShadowTokens = { subtle: 'none', lifted: 'none' };

const helveticaStack =
  '"Helvetica Neue", Helvetica, "IBM Plex Sans", "Arial Black", Arial, sans-serif';
const plexMonoStack = '"IBM Plex Mono", "Helvetica Neue Mono", "Courier New", Courier, monospace';

export const brutalistPreset: DesignSystem = {
  colors: brutalistColors,
  typefaces: {
    serif: helveticaStack,
    mono: plexMonoStack,
  },
  spacing,
  radii: flatRadii,
  shadows: flatShadows,
  breakpoints,
  darkColors: brutalistDarkColors,
};
