// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { V3Preset } from './types.ts';

export const defaultPresetV3: V3Preset = {
  name: 'default',
  description: 'Light, neutral editorial theme with a calm blue accent.',
  swatches: ['#fdfcf7', '#ffffff', '#273348', '#2b6cb0', '#9c4221'],
  themeCss: `@theme {
  --color-bg: oklch(0.98 0.005 80);
  --color-surface: oklch(1 0 0);
  --color-foreground: oklch(0.18 0.02 250);
  --color-muted-foreground: oklch(0.45 0.02 250);
  --color-muted: oklch(0.85 0.01 250);
  --color-primary: oklch(0.51 0.13 240);
  --color-success: oklch(0.52 0.13 145);
  --color-warn: oklch(0.55 0.14 60);
  --color-danger: oklch(0.50 0.18 25);
  --font-display: "EB Garamond", Georgia, serif;
  --font-body: "Inter", -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --radius-card: 0.75rem;
  --shadow-card: 0 1px 3px oklch(0.18 0.02 250 / 0.1);
}`,
};
