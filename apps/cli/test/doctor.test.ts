// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { chmod, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { testInternals } from '../src/commands/doctor.ts';
import { credentialsPath, writeCredentials } from '../src/credentials.ts';

let configHome: string;
const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

beforeEach(async () => {
  configHome = await mkdtemp(join(tmpdir(), 'azri-doctor-test-'));
  process.env = { ...originalEnv, XDG_CONFIG_HOME: configHome };
});

afterEach(async () => {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
  await rm(configHome, { recursive: true, force: true });
});

describe('doctor credential checks', () => {
  test('passes credentials file when at least one provider is stored', async () => {
    await writeCredentials({ openai: 'sk-test-openai' });

    await expect(testInternals.checkCredentialsFile()).resolves.toEqual({
      status: 'PASS',
      name: 'Credentials file',
      reason: 'at least one provider credential is stored',
    });
  });

  test('warns when credentials file is absent but env vars are set', async () => {
    process.env['GOOGLE_API_KEY'] = 'google-test';

    await expect(testInternals.checkCredentialsFile()).resolves.toEqual({
      status: 'WARN',
      name: 'Credentials file',
      reason: 'missing, but provider env vars are set',
    });
  });

  test('fails overly broad credential permissions', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test' });
    await chmod(credentialsPath(), 0o644);

    await expect(testInternals.checkCredentialPermissions()).resolves.toEqual({
      status: 'FAIL',
      name: 'Credentials permissions',
      reason: 'mode 644 is too open',
    });
  });
});

describe('doctor provider reachability', () => {
  test('uses HEAD against selected provider with stored key', async () => {
    await writeCredentials({ openai: 'sk-test-openai' });
    const fetchMock = mock(async () => new Response('', { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    await expect(testInternals.checkProviderReachability('openai')).resolves.toEqual({
      status: 'PASS',
      name: 'Provider reachability',
      reason: 'openai responded with HTTP 200',
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.openai.com/v1/models');
    expect((init as RequestInit).method).toBe('HEAD');
    expect((init as RequestInit).headers).toEqual({ Authorization: 'Bearer sk-test-openai' });
  });
});
