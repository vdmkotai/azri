// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PRESET_NAMES } from '../../../packages/renderer/src/design-system/index.ts';
import { testInternals } from '../src/commands/theme.ts';

let workdir: string;

beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'azri-theme-test-'));
});

afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

describe('theme options', () => {
  test('builds one option per preset', () => {
    const options = testInternals.buildThemeOptions();
    expect(options.length).toBe(PRESET_NAMES.length);
    for (const name of PRESET_NAMES) {
      expect(options.some((o) => o.value === name)).toBe(true);
    }
  });

  test('label embeds swatches and description', () => {
    const label = testInternals.themeLabel('default');
    expect(label).toContain('default');
    expect(label).toContain('neutral baseline');
    expect(label.includes('\u001B[38;2;')).toBe(true);
  });
});

describe('writeThemeToConfig', () => {
  test('creates .azri/config.json with theme when absent', async () => {
    const path = await testInternals.writeThemeToConfig(workdir, 'github-dark');
    expect(path).toBe(join(workdir, '.azri', 'config.json'));
    const written = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
    expect(written['theme']).toBe('github-dark');
  });

  test('preserves existing keys when updating theme', async () => {
    const path = join(workdir, '.azri', 'config.json');
    await Bun.write(
      path,
      JSON.stringify({ modules: ['packages/types'], maxFiles: 99, theme: 'default' }),
    );
    await testInternals.writeThemeToConfig(workdir, 'sepia');
    const written = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
    expect(written['theme']).toBe('sepia');
    expect(written['modules']).toEqual(['packages/types']);
    expect(written['maxFiles']).toBe(99);
  });

  test('writes 0644 permissions', async () => {
    const path = await testInternals.writeThemeToConfig(workdir, 'default');
    const stat = await Bun.file(path).stat();
    expect((stat.mode ?? 0) & 0o777).toBe(0o644);
  });

  test('rejects invalid existing config', async () => {
    const path = join(workdir, '.azri', 'config.json');
    await Bun.write(path, JSON.stringify({ maxFiles: 'not-a-number' }));
    await expect(testInternals.writeThemeToConfig(workdir, 'default')).rejects.toThrow();
  });

  test('round-trips via subsequent reads', async () => {
    await testInternals.writeThemeToConfig(workdir, 'brutalist');
    await testInternals.writeThemeToConfig(workdir, 'vscode-modern');
    const written = JSON.parse(
      await readFile(join(workdir, '.azri', 'config.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(written['theme']).toBe('vscode-modern');
  });

  test('does not produce errors for all presets', async () => {
    for (const name of PRESET_NAMES) {
      await testInternals.writeThemeToConfig(workdir, name);
      await writeFile(join(workdir, '.azri', 'config.json'), '{}');
    }
  });
});
