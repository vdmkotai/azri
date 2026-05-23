// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { testInternals } from '../src/commands/auth.ts';
import { readCredentials, writeCredentials } from '../src/credentials.ts';

let configHome: string;
const originalEnv = { ...process.env };

beforeEach(async () => {
  configHome = await mkdtemp(join(tmpdir(), 'azri-default-command-test-'));
  process.env = { ...originalEnv, XDG_CONFIG_HOME: configHome };
});

afterEach(async () => {
  process.env = { ...originalEnv };
  await rm(configHome, { recursive: true, force: true });
});

describe('azri auth default', () => {
  test('sets explicit saved provider silently', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test', openai: 'sk-openai-test' });
    const log = spyOn(console, 'log').mockImplementation(() => {});

    const code = await testInternals.runDefault(['openai']);

    expect(code).toBe(0);
    expect((await readCredentials()).default).toBe('openai');
    expect(log).toHaveBeenCalledWith('Default provider set to openai.');
    log.mockRestore();
  });

  test('errors for invalid provider', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test' });
    const error = spyOn(console, 'error').mockImplementation(() => {});

    const code = await testInternals.runDefault(['bogus']);

    expect(code).toBe(1);
    expect(error).toHaveBeenCalledWith(
      "Error: invalid provider 'bogus'. Choose anthropic, openai, google.",
    );
    error.mockRestore();
  });

  test('errors for provider without saved key', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test' });
    const error = spyOn(console, 'error').mockImplementation(() => {});

    const code = await testInternals.runDefault(['openai']);

    expect(code).toBe(1);
    expect(error).toHaveBeenCalledWith(
      "Error: no openai key configured — run 'azri auth login' first.",
    );
    error.mockRestore();
  });

  test('errors when no providers are configured', async () => {
    const error = spyOn(console, 'error').mockImplementation(() => {});

    const code = await testInternals.runDefault(['anthropic']);

    expect(code).toBe(1);
    expect(error).toHaveBeenCalledWith(
      'Error: no providers configured. Run `azri auth login` first.',
    );
    error.mockRestore();
  });
});
