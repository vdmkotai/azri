// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { V3Preset } from './types.ts';

export const sepiaPresetV3: V3Preset = {
  name: 'sepia',
  description: 'Warm cream, serif-forward reading theme with rust accents.',
  swatches: ['#f4ecd8', '#f9f1dd', '#5c4434', '#8b1a1a', '#a8731f'],
  themeCss: `@theme {
  --color-bg: oklch(0.94 0.025 80);
  --color-surface: oklch(0.97 0.020 80);
  --color-foreground: oklch(0.30 0.05 50);
  --color-muted-foreground: oklch(0.50 0.04 55);
  --color-muted: oklch(0.82 0.025 75);
  --color-primary: oklch(0.45 0.15 30);
  --color-success: oklch(0.50 0.12 130);
  --color-warn: oklch(0.55 0.14 65);
  --color-danger: oklch(0.45 0.18 25);
  --font-display: "EB Garamond", "Crimson Pro", Georgia, serif;
  --font-body: "EB Garamond", "Crimson Pro", Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --radius-card: 0.5rem;
  --shadow-card: 0 2px 4px oklch(0.30 0.05 50 / 0.12);
}`,
};
