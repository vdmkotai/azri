// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { V3Preset } from './types.ts';

export const vscodeModernPresetV3: V3Preset = {
  name: 'vscode-modern',
  description: 'Dense cream-white developer theme inspired by modern VS Code panels.',
  swatches: ['#fafafa', '#ffffff', '#1e1e1e', '#0a7ec0', '#bf6f00'],
  themeCss: `@theme {
  --color-bg: oklch(0.985 0.002 90);
  --color-surface: oklch(1 0 0);
  --color-foreground: oklch(0.20 0.005 250);
  --color-muted-foreground: oklch(0.50 0.008 250);
  --color-muted: oklch(0.88 0.008 250);
  --color-primary: oklch(0.52 0.18 240);
  --color-success: oklch(0.55 0.15 150);
  --color-warn: oklch(0.62 0.16 70);
  --color-danger: oklch(0.55 0.20 25);
  --font-display: "Inter", -apple-system, sans-serif;
  --font-body: "Inter", -apple-system, sans-serif;
  --font-mono: "Cascadia Code", "JetBrains Mono", ui-monospace, monospace;
  --radius-card: 0.375rem;
  --shadow-card: 0 1px 2px oklch(0.20 0.005 250 / 0.08);
}`,
};
