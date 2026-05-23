// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { brutalistPresetV3 } from './brutalist.ts';
import { defaultPresetV3 } from './default.ts';
import { githubDarkPresetV3 } from './github-dark.ts';
import { sepiaPresetV3 } from './sepia.ts';
import type { V3Preset } from './types.ts';
import { vscodeModernPresetV3 } from './vscode-modern.ts';

export type { V3Preset } from './types.ts';

export const PRESETS_V3: Record<string, V3Preset> = {
  [defaultPresetV3.name]: defaultPresetV3,
  [githubDarkPresetV3.name]: githubDarkPresetV3,
  [vscodeModernPresetV3.name]: vscodeModernPresetV3,
  [sepiaPresetV3.name]: sepiaPresetV3,
  [brutalistPresetV3.name]: brutalistPresetV3,
};

export function resolveV3Theme(name?: string): V3Preset {
  if (!name) {
    return defaultPresetV3;
  }

  return PRESETS_V3[name] ?? defaultPresetV3;
}
