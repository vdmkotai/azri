// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export * from './tokens.ts';
export * from './css.ts';
export * from './presets-v3/index.ts';

import { PRESETS_V3, resolveV3Theme } from './presets-v3/index.ts';

export const PRESETS = PRESETS_V3;
export const PRESET_NAMES: ReadonlyArray<string> = Object.keys(PRESETS_V3);
export const resolveTheme = resolveV3Theme;
