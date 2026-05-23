// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { DesignSystem } from '../tokens.ts';
import { brutalistPreset } from './brutalist.ts';
import { defaultPreset } from './default.ts';
import { githubDarkPreset } from './github-dark.ts';
import { sepiaPreset } from './sepia.ts';
import { vscodeModernPreset } from './vscode-modern.ts';

export const PRESETS: Record<string, DesignSystem> = {
  default: defaultPreset,
  'github-dark': githubDarkPreset,
  'vscode-modern': vscodeModernPreset,
  sepia: sepiaPreset,
  brutalist: brutalistPreset,
};

export const PRESET_NAMES: ReadonlyArray<string> = Object.keys(PRESETS);

export function resolveTheme(name?: string): DesignSystem {
  if (!name) return PRESETS['default']!;
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`unknown theme '${name}'. Available: ${PRESET_NAMES.join(', ')}`);
  }
  return preset;
}

export { brutalistPreset, defaultPreset, githubDarkPreset, sepiaPreset, vscodeModernPreset };
