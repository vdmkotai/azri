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
  --color-foreground: oklch(0.92 0.012 240);
  --color-muted-foreground: oklch(0.68 0.015 240);
  --color-muted: oklch(0.32 0.018 245);
  --color-primary: oklch(0.72 0.16 240);
  --color-success: oklch(0.74 0.18 145);
  --color-warn: oklch(0.78 0.14 75);
  --color-danger: oklch(0.70 0.20 25);
  --font-display: ui-sans-serif, system-ui, sans-serif;
  --font-body: ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
  --radius-card: 0.5rem;
  --shadow-card: 0 1px 3px oklch(0 0 0 / 0.3);
}`,
};
