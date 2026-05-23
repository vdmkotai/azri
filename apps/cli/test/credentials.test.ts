// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  autoDetectProvider,
  readProjectDefaultProvider,
  resolveDefaultProvider,
  writeCredentials,
} from '../src/credentials.ts';

let configHome: string;
let projectDir: string;
const originalEnv = { ...process.env };

beforeEach(async () => {
  configHome = await mkdtemp(join(tmpdir(), 'azri-credentials-test-home-'));
  projectDir = await mkdtemp(join(tmpdir(), 'azri-credentials-test-project-'));
  process.env = { ...originalEnv, XDG_CONFIG_HOME: configHome };
  delete process.env['ANTHROPIC_API_KEY'];
  delete process.env['OPENAI_API_KEY'];
  delete process.env['GOOGLE_API_KEY'];
  delete process.env['AZRI_LLM_PROVIDER'];
});

afterEach(async () => {
  process.env = { ...originalEnv };
  await rm(configHome, { recursive: true, force: true });
  await rm(projectDir, { recursive: true, force: true });
});

async function writeProjectConfig(defaultProvider: string): Promise<void> {
  await mkdir(join(projectDir, '.azri'), { recursive: true });
  await writeFile(
    join(projectDir, '.azri', 'config.json'),
    `${JSON.stringify({ defaultProvider })}\n`,
  );
}

describe('resolveDefaultProvider', () => {
  test('returns env override when AZRI_LLM_PROVIDER is valid', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test' });
    process.env['AZRI_LLM_PROVIDER'] = 'google';

    expect(resolveDefaultProvider(projectDir)).toEqual({ provider: 'google' });
  });

  test('uses project default when valid and configured', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test', openai: 'sk-openai-test' });
    await writeProjectConfig('openai');

    expect(readProjectDefaultProvider(projectDir)).toBe('openai');
    expect(resolveDefaultProvider(projectDir)).toEqual({ provider: 'openai' });
  });

  test('falls back to stored default when project default lacks key', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test', default: 'anthropic' });
    await writeProjectConfig('openai');

    expect(resolveDefaultProvider(projectDir)).toEqual({ provider: 'anthropic' });
  });

  test('uses single available provider', async () => {
    await writeCredentials({ google: 'sk-google-test' });

    expect(resolveDefaultProvider(projectDir)).toEqual({ provider: 'google' });
  });

  test('returns ambiguous for multiple providers with no default', async () => {
    await writeCredentials({ anthropic: 'sk-ant-test', openai: 'sk-openai-test' });

    expect(resolveDefaultProvider(projectDir)).toEqual({ ambiguous: ['anthropic', 'openai'] });
    expect(autoDetectProvider()).toBe('anthropic');
  });

  test('returns empty when no providers are configured', () => {
    expect(resolveDefaultProvider(projectDir)).toEqual({ empty: true });
  });
});
