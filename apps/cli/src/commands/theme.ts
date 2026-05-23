// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import * as p from '@clack/prompts';

import { PRESET_NAMES, PRESETS } from '../../../../packages/renderer/src/design-system/index.ts';
import { AzriConfigSchema } from '../../../../packages/types/src/index.ts';
import { swatchRow } from '../ui/swatch.ts';

const THEME_DESCRIPTIONS: Record<string, string> = {
  default: 'neutral baseline',
  'github-dark': 'dark mode, GitHub palette',
  'vscode-modern': 'light, dense, Inter+Cascadia',
  sepia: 'warm cream, serif-forward',
  brutalist: 'high-contrast, no shadows',
};

function presetSwatches(name: string): string {
  const preset = PRESETS[name];
  if (!preset) return '';
  const c = preset.colors;
  return swatchRow([c.accent, c.background, c.severity.info, c.severity.warn, c.severity.critical]);
}

function themeLabel(name: string): string {
  const padded = name.padEnd(14);
  const swatches = presetSwatches(name);
  const desc = THEME_DESCRIPTIONS[name] ?? '';
  return `${padded}  ${swatches}   ${desc}`;
}

export function buildThemeOptions(): ReadonlyArray<{ value: string; label: string }> {
  return PRESET_NAMES.map((name) => ({ value: name, label: themeLabel(name) }));
}

function configPath(cwd: string): string {
  return join(cwd, '.azri', 'config.json');
}

async function readExistingConfig(path: string): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}

export async function writeThemeToConfig(cwd: string, theme: string): Promise<string> {
  const path = configPath(cwd);
  const existing = await readExistingConfig(path);
  const merged = { ...existing, theme };
  const validated = AzriConfigSchema.parse(merged);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(validated, null, 2)}\n`, { mode: 0o644 });
  return path;
}

function printThemeHelp(): void {
  console.log(
    [
      'azri theme — pick the default rendering theme',
      '',
      'USAGE',
      '  azri theme',
      '',
      'Writes the chosen theme to ./.azri/config.json in the current directory.',
    ].join('\n'),
  );
}

export async function runTheme(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    printThemeHelp();
    return 0;
  }

  try {
    p.intro('azri · theme');

    const cwd = process.cwd();
    const existing = await readExistingConfig(configPath(cwd));
    const current =
      typeof existing['theme'] === 'string' ? (existing['theme'] as string) : 'default';
    const initialValue = PRESET_NAMES.includes(current) ? current : 'default';

    const choice = await p.select<string>({
      message: 'Default theme',
      options: buildThemeOptions(),
      initialValue,
    });

    if (p.isCancel(choice)) {
      p.cancel('Cancelled.');
      return 0;
    }

    const path = await writeThemeToConfig(cwd, choice);
    p.outro(`Saved theme '${choice}' to ${path}`);
    return 0;
  } catch (error) {
    p.cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

export const testInternals = { themeLabel, buildThemeOptions, writeThemeToConfig };
