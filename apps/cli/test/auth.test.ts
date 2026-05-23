// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { chmod, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { testInternals } from '../src/commands/auth.ts';
import {
  credentialsPath,
  getApiKey,
  readCredentials,
  writeCredentials,
} from '../src/credentials.ts';

let configHome: string;
const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

beforeEach(async () => {
  configHome = await mkdtemp(join(tmpdir(), 'azri-auth-test-'));
  process.env = { ...originalEnv, XDG_CONFIG_HOME: configHome };
});

afterEach(async () => {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
  await rm(configHome, { recursive: true, force: true });
});

describe('credentials', () => {
  test('writes credentials as 0600 JSON and reads providers', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test', openai: null, google: null });

    const path = credentialsPath();
    const file = Bun.file(path);
    const parsed = await file.json();
    const mode = ((await file.stat()).mode ?? 0) & 0o777;

    expect(parsed).toEqual({ anthropic: 'sk-ant-test', openai: null, google: null });
    expect(mode).toBe(0o600);
    expect(await readCredentials()).toEqual({
      anthropic: 'sk-ant-test',
      openai: null,
      google: null,
    });
  });

  test('fixes overly broad permissions before returning credentials', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test' });
    await chmod(credentialsPath(), 0o644);

    expect((await readCredentials()).anthropic).toBe('sk-ant-test');
    expect(((await Bun.file(credentialsPath()).stat()).mode ?? 0) & 0o777).toBe(0o600);
  });

  test('env var overrides stored credential for backward compatibility', async () => {
    await writeCredentials({ anthropic: 'stored-key' });
    process.env['ANTHROPIC_API_KEY'] = 'env-key';

    expect(getApiKey('anthropic')).toBe('env-key');
  });
});

describe('auth validation', () => {
  test('accepts anthropic 405 validation response', async () => {
    globalThis.fetch = mock(async () => new Response('', { status: 405 })) as typeof fetch;

    await expect(testInternals.validateKey('anthropic', 'sk-ant-test')).resolves.toEqual({
      ok: true,
      reason: 'validated',
    });
  });

  test('reports validation HTTP failures without exposing key', async () => {
    globalThis.fetch = mock(async () => new Response('', { status: 401 })) as typeof fetch;

    await expect(testInternals.validateKey('openai', 'sk-test-secret')).resolves.toEqual({
      ok: false,
      reason: 'HTTP 401',
    });
  });
});
