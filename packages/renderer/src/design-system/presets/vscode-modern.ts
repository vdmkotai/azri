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

const vscodeColors: ColorTokens = {
  text: '#1e1e1e',
  background: '#fafafa',
  accent: '#0a7ec0',
  severity: {
    info: '#0a7ec0',
    warn: '#bf6f00',
    critical: '#a31515',
  },
  bgCode: {
    background: '#1e1e1e',
    text: '#d4d4d4',
  },
};

const vscodeDarkColors: ColorTokens = {
  text: '#d4d4d4',
  background: '#1e1e1e',
  accent: '#4fc1ff',
  severity: {
    info: '#4fc1ff',
    warn: '#dcdcaa',
    critical: '#f48771',
  },
  bgCode: {
    background: '#252526',
    text: '#d4d4d4',
  },
};

const denseSpacing: SpacingTokens = {
  xs: 3,
  sm: 7,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 27,
  '3xl': 41,
  '4xl': 54,
};

export const vscodeModernPreset: DesignSystem = {
  colors: vscodeColors,
  typefaces: {
    serif: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    mono: '"Cascadia Code", "Cascadia Mono", ui-monospace, SFMono-Regular, Consolas, monospace',
  },
  spacing: denseSpacing,
  radii,
  shadows,
  breakpoints,
  darkColors: vscodeDarkColors,
};
