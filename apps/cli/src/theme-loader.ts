// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PRESET_NAMES } from '../../../packages/renderer/src/design-system/index.ts';
import {
  UserTokensSchema,
  validateAzriConfig,
  type AzriConfig,
  type DesignTokens,
} from '../../../packages/types/src/index.ts';

export const AVAILABLE_THEMES = PRESET_NAMES;

export function validateThemeName(name: string): void {
  if (!AVAILABLE_THEMES.includes(name)) {
    throw new Error(`unknown theme '${name}'. Available: ${AVAILABLE_THEMES.join(', ')}`);
  }
}

async function readJsonIfExists(path: string): Promise<unknown | null> {
  try {
    const text = await readFile(path, 'utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function loadAzriConfig(repoPath: string): Promise<AzriConfig> {
  const raw = await readJsonIfExists(join(repoPath, '.azri', 'config.json'));
  if (!raw) return {};
  return validateAzriConfig(raw);
}

export async function loadUserTokens(repoPath: string): Promise<DesignTokens | undefined> {
  const raw = await readJsonIfExists(join(repoPath, '.azri', 'theme.json'));
  if (!raw) return undefined;
  const result = UserTokensSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid .azri/theme.json:\n${issues}`);
  }
  return result.data as DesignTokens;
}

export interface ResolvedThemeConfig {
  theme: string | undefined;
  tokens: DesignTokens | undefined;
}

export async function resolveThemeConfig(opts: {
  repoPath: string;
  cliTheme?: string;
  configTheme?: string;
}): Promise<ResolvedThemeConfig> {
  const theme = opts.cliTheme ?? opts.configTheme;
  if (theme) validateThemeName(theme);
  const tokens = await loadUserTokens(opts.repoPath);
  return {
    theme,
    tokens,
  };
}
