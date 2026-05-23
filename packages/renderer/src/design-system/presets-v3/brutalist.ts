// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { V3Preset } from './types.ts';

export const brutalistPresetV3: V3Preset = {
  name: 'brutalist',
  description: 'Pure black-and-white theme with hard edges and no shadows.',
  swatches: ['#ffffff', '#000000', '#666666', '#15803d', '#b91c1c'],
  themeCss: `@theme {
  --color-bg: oklch(1 0 0);
  --color-surface: oklch(1 0 0);
  --color-foreground: oklch(0 0 0);
  --color-muted-foreground: oklch(0.40 0 0);
  --color-muted: oklch(0.85 0 0);
  --color-primary: oklch(0 0 0);
  --color-success: oklch(0.40 0.18 145);
  --color-warn: oklch(0.50 0.18 70);
  --color-danger: oklch(0.45 0.22 25);
  --font-display: "Helvetica Neue", "Arial", sans-serif;
  --font-body: "Helvetica Neue", "Arial", sans-serif;
  --font-mono: "IBM Plex Mono", "Courier New", monospace;
  --radius-card: 0;
  --shadow-card: none;
}`,
};
