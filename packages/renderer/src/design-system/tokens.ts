// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

/**
 * Azri design tokens — locked vocabulary for the renderer.
 *
 * Constraints (intentional):
 * - Exactly 4 base color buckets (text, background, accent, severity)
 *   where severity itself has 3 subtokens (info, warn, critical)
 * - Exactly 2 typefaces (serif for prose, mono for code)
 * - No Tailwind, no icon libraries, no gradients in defaults, no emoji by default
 *
 * Users can override via AzriConfig.tokens which is merged over these defaults.
 */

export interface SeverityTokens {
  info: string;
  warn: string;
  critical: string;
}

export interface BgCodeTokens {
  background: string;
  text: string;
}

export interface ColorTokens {
  text: string;
  background: string;
  accent: string;
  severity: SeverityTokens;
  bgCode: BgCodeTokens;
}

export interface TypefaceTokens {
  serif: string;
  mono: string;
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
}

export interface RadiiTokens {
  sm: number;
  md: number;
  lg: number;
}

export interface ShadowTokens {
  subtle: string;
  lifted: string;
}

export interface BreakpointTokens {
  mobile: number;
  desktop: number;
}

export interface DesignSystem {
  colors: ColorTokens;
  typefaces: TypefaceTokens;
  spacing: SpacingTokens;
  radii: RadiiTokens;
  shadows: ShadowTokens;
  breakpoints: BreakpointTokens;
  /** Optional dark-mode color overrides. When set, emitted under `@media (prefers-color-scheme:dark)`. */
  darkColors?: ColorTokens;
}

export const colors: ColorTokens = {
  text: '#1a202c',
  background: '#fdfcf7',
  accent: '#2b6cb0',
  severity: {
    info: '#2c5282',
    warn: '#9c4221',
    critical: '#9b2c2c',
  },
  bgCode: {
    background: '#1a202c',
    text: '#e2e8f0',
  },
};

export const colorsDark: ColorTokens = {
  text: '#e2e8f0',
  background: '#161616',
  accent: '#63b3ed',
  severity: {
    info: '#4299e1',
    warn: '#ed8936',
    critical: '#fc8181',
  },
  bgCode: {
    background: '#1a202c',
    text: '#e2e8f0',
  },
};

export const typefaces: TypefaceTokens = {
  serif: '"EB Garamond", "Iowan Old Style", "Palatino Linotype", Georgia, serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

export const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const radii: RadiiTokens = { sm: 4, md: 8, lg: 12 };

export const shadows: ShadowTokens = {
  subtle: '0 1px 3px rgba(0,0,0,.04)',
  lifted: '0 4px 12px rgba(0,0,0,.08)',
};

export const breakpoints: BreakpointTokens = { mobile: 480, desktop: 768 };

export const designSystem: DesignSystem = {
  colors,
  typefaces,
  spacing,
  radii,
  shadows,
  breakpoints,
};
