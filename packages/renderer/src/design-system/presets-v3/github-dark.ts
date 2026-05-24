// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { V3Preset } from './types.ts';

export const githubDarkPresetV3: V3Preset = {
  name: 'github-dark',
  description: 'Dark, GitHub-inspired interface theme with bright status colors.',
  swatches: ['#0d1117', '#161b22', '#c9d1d9', '#58a6ff', '#3fb950'],
  themeCss: `@theme {
  --color-bg: oklch(0.16 0.012 250);
  --color-surface: oklch(0.20 0.014 250);
  --color-foreground: oklch(0.94 0.012 240);
  --color-muted-foreground: oklch(0.78 0.015 240);
  --color-muted: oklch(0.32 0.018 245);
  --color-primary: oklch(0.78 0.17 240);
  --color-success: oklch(0.82 0.20 145);
  --color-warn: oklch(0.85 0.16 80);
  --color-danger: oklch(0.78 0.22 25);
  --color-blue-700: oklch(0.80 0.16 240);
  --color-blue-800: oklch(0.92 0.05 240);
  --color-blue-100: oklch(0.32 0.10 240);
  --color-blue-900: oklch(0.95 0.04 240);
  --color-purple-700: oklch(0.80 0.16 295);
  --color-purple-800: oklch(0.92 0.05 295);
  --color-purple-100: oklch(0.32 0.10 295);
  --color-purple-900: oklch(0.95 0.04 295);
  --color-orange-700: oklch(0.82 0.17 55);
  --color-orange-800: oklch(0.92 0.05 55);
  --color-orange-100: oklch(0.32 0.10 55);
  --color-orange-900: oklch(0.95 0.04 55);
  --color-green-700: oklch(0.82 0.18 145);
  --color-green-800: oklch(0.92 0.05 145);
  --color-green-100: oklch(0.32 0.10 145);
  --color-green-900: oklch(0.95 0.04 145);
  --color-pink-700: oklch(0.82 0.16 0);
  --color-pink-800: oklch(0.92 0.05 0);
  --color-pink-100: oklch(0.32 0.10 0);
  --color-pink-900: oklch(0.95 0.04 0);
  --color-amber-700: oklch(0.85 0.17 85);
  --color-amber-800: oklch(0.92 0.05 85);
  --color-amber-100: oklch(0.32 0.10 85);
  --color-amber-900: oklch(0.95 0.04 85);
  --color-red-700: oklch(0.80 0.18 25);
  --color-red-800: oklch(0.92 0.05 25);
  --color-red-100: oklch(0.32 0.10 25);
  --color-red-900: oklch(0.95 0.04 25);
  --font-display: ui-sans-serif, system-ui, sans-serif;
  --font-body: ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
  --radius-card: 0.5rem;
  --shadow-card: 0 1px 3px oklch(0 0 0 / 0.3);
}`,
};
