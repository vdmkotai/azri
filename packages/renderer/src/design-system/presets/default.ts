// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import {
  breakpoints,
  colors,
  colorsDark,
  radii,
  shadows,
  spacing,
  typefaces,
  type DesignSystem,
} from '../tokens.ts';

export const defaultPreset: DesignSystem = {
  colors,
  typefaces,
  spacing,
  radii,
  shadows,
  breakpoints,
  darkColors: colorsDark,
};
