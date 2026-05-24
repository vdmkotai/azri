// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PRESET_NAMES } from '../../../packages/renderer/src/design-system/index.ts';
import { testInternals } from '../src/commands/setup.ts';

let workdir: string;
const originalEnv = { ...process.env };

beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'azri-setup-test-'));
  process.env = { ...originalEnv };
  delete process.env['ANTHROPIC_API_KEY'];
  delete process.env['OPENAI_API_KEY'];
  delete process.env['GOOGLE_API_KEY'];
});

afterEach(async () => {
  process.env = { ...originalEnv };
  await rm(workdir, { recursive: true, force: true });
});

describe('setup option builders', () => {
  test('theme options cover every preset', () => {
    const options = testInternals.buildThemeOptions();
    expect(options.length).toBe(PRESET_NAMES.length);
    for (const name of PRESET_NAMES) {
      expect(options.some((o) => o.value === name)).toBe(true);
    }
  });

  test('verbosity options expose the three Verbosity values in order', () => {
    expect(testInternals.buildVerbosityOptions().map((o) => o.value)).toEqual([
      'concise',
      'standard',
      'detailed',
    ]);
  });

  test('provider options omit model-version hints', () => {
    const labels = testInternals.buildProviderOptions().map((o) => o.label);
    expect(labels).toEqual(['Anthropic', 'OpenAI', 'Google']);
  });

  test('theme label embeds swatches', () => {
    const label = testInternals.themeLabel('default');
    expect(label).toContain('default');
    expect(label.includes('\u001B[38;2;')).toBe(true);
  });
});

describe('sanitizeKey (setup)', () => {
  test('strips whitespace and control characters', () => {
    expect(testInternals.sanitizeKey('  sk-test\n')).toBe('sk-test');
    expect(testInternals.sanitizeKey('sk\r\n\u0000-test')).toBe('sk-test');
  });
});

describe('envProviderName', () => {
  test('returns null when no provider env vars are set', () => {
    expect(testInternals.envProviderName()).toBeNull();
  });

  test('detects ANTHROPIC_API_KEY first', () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant-test';
    expect(testInternals.envProviderName()).toBe('anthropic');
  });

  test('detects OPENAI_API_KEY when only that is set', () => {
    process.env['OPENAI_API_KEY'] = 'sk-test';
    expect(testInternals.envProviderName()).toBe('openai');
  });

  test('detects GOOGLE_API_KEY when only that is set', () => {
    process.env['GOOGLE_API_KEY'] = 'g-test';
    expect(testInternals.envProviderName()).toBe('google');
  });
});

describe('writeSetupConfig', () => {
  test('creates .azri/config.json with theme and verbosity', async () => {
    const path = await testInternals.writeSetupConfig(workdir, {
      theme: 'sepia',
      verbosity: 'detailed',
    });
    expect(path).toBe(join(workdir, '.azri', 'config.json'));
    const written = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
    expect(written['theme']).toBe('sepia');
    expect(written['verbosity']).toBe('detailed');
  });

  test('preserves unrelated existing keys', async () => {
    const path = join(workdir, '.azri', 'config.json');
    await Bun.write(path, JSON.stringify({ modules: ['packages/types'], maxFiles: 42 }));
    await testInternals.writeSetupConfig(workdir, {
      theme: 'github-dark',
      verbosity: 'concise',
    });
    const written = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
    expect(written['modules']).toEqual(['packages/types']);
    expect(written['maxFiles']).toBe(42);
    expect(written['theme']).toBe('github-dark');
    expect(written['verbosity']).toBe('concise');
  });

  test('writes 0644 permissions', async () => {
    const path = await testInternals.writeSetupConfig(workdir, {
      theme: 'default',
      verbosity: 'standard',
    });
    const stat = await Bun.file(path).stat();
    expect((stat.mode ?? 0) & 0o777).toBe(0o644);
  });

  test('round-trips between subsequent updates', async () => {
    await testInternals.writeSetupConfig(workdir, { theme: 'default', verbosity: 'standard' });
    await testInternals.writeSetupConfig(workdir, { theme: 'brutalist', verbosity: 'detailed' });
    const written = JSON.parse(
      await readFile(join(workdir, '.azri', 'config.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(written['theme']).toBe('brutalist');
    expect(written['verbosity']).toBe('detailed');
  });

  test('rejects invalid existing config (numeric mismatch)', async () => {
    const dir = join(workdir, '.azri');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'config.json'), JSON.stringify({ maxFiles: 'oops' }));
    await expect(
      testInternals.writeSetupConfig(workdir, { theme: 'default', verbosity: 'standard' }),
    ).rejects.toThrow();
  });
});
