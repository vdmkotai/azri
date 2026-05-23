// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { breakpoints, radii, shadows, spacing, type DesignSystem } from '../tokens.ts';

const githubDarkColors = {
  text: '#c9d1d9',
  background: '#0d1117',
  accent: '#58a6ff',
  severity: {
    info: '#3fb950',
    warn: '#d29922',
    critical: '#f85149',
  },
  bgCode: {
    background: '#161b22',
    text: '#c9d1d9',
  },
};

const systemSans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';
const systemMono =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

export const githubDarkPreset: DesignSystem = {
  colors: githubDarkColors,
  typefaces: {
    serif: systemSans,
    mono: systemMono,
  },
  spacing,
  radii,
  shadows,
  breakpoints,
  darkColors: githubDarkColors,
};
