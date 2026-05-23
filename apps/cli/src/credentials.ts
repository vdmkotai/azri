// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { chmodSync, readFileSync, statSync } from 'node:fs';
import { chmod, mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import type { ProviderName } from '../../../packages/core/src/index.ts';

export type Credentials = Partial<Record<ProviderName, string | null>>;

export const PROVIDERS: readonly ProviderName[] = ['anthropic', 'openai', 'google'];

const ENV_VARS: Record<ProviderName, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
};

export function envVarName(provider: ProviderName): string {
  return ENV_VARS[provider];
}

export function credentialsPath(): string {
  const configHome = process.env['XDG_CONFIG_HOME'] ?? join(homedir(), '.config');
  const expanded =
    configHome === '~' || configHome.startsWith('~/')
      ? join(homedir(), configHome.slice(2))
      : configHome;
  return join(expanded, 'azri', 'credentials');
}

export function isProvider(value: string): value is ProviderName {
  return (PROVIDERS as readonly string[]).includes(value);
}

export function selectedProvider(): ProviderName {
  const raw = process.env['AZRI_LLM_PROVIDER'];
  return raw && isProvider(raw) ? raw : 'anthropic';
}

export async function credentialsFileExists(path = credentialsPath()): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function credentialsMode(path = credentialsPath()): Promise<number | null> {
  try {
    return (await stat(path)).mode & 0o777;
  } catch {
    return null;
  }
}

export async function readCredentials(path = credentialsPath()): Promise<Credentials> {
  try {
    const info = await stat(path);
    const mode = info.mode & 0o777;
    if ((mode & 0o077) !== 0) {
      console.warn(`Warning: credentials file permissions too open; fixing ${path} to 0600.`);
      await chmod(path, 0o600);
    }
    const parsed = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
    const credentials: Credentials = {};
    for (const provider of PROVIDERS) {
      const value = parsed[provider];
      credentials[provider] = typeof value === 'string' && value.length > 0 ? value : null;
    }
    return credentials;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return {};
    if (error instanceof SyntaxError) {
      throw new TypeError(`invalid credentials JSON at ${path}`, { cause: error });
    }
    throw error;
  }
}

export function readCredentialsSync(path = credentialsPath()): Credentials {
  try {
    const info = statSync(path);
    const mode = info.mode & 0o777;
    if ((mode & 0o077) !== 0) {
      console.warn(`Warning: credentials file permissions too open; fixing ${path} to 0600.`);
      chmodSync(path, 0o600);
    }
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    const credentials: Credentials = {};
    for (const provider of PROVIDERS) {
      const value = parsed[provider];
      credentials[provider] = typeof value === 'string' && value.length > 0 ? value : null;
    }
    return credentials;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return {};
    if (error instanceof SyntaxError) {
      throw new TypeError(`invalid credentials JSON at ${path}`, { cause: error });
    }
    throw error;
  }
}

export async function writeCredentials(
  credentials: Credentials,
  path = credentialsPath(),
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const normalized: Required<Credentials> = {
    anthropic: credentials.anthropic ?? null,
    openai: credentials.openai ?? null,
    google: credentials.google ?? null,
  };
  await writeFile(path, `${JSON.stringify(normalized, null, 2)}\n`, { mode: 0o600 });
  await chmod(path, 0o600);
}

export async function removeCredentials(path = credentialsPath()): Promise<void> {
  try {
    await unlink(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export async function saveCredential(provider: ProviderName, key: string): Promise<void> {
  const credentials = await readCredentials();
  credentials[provider] = key;
  await writeCredentials(credentials);
}

export function readCredential(provider: ProviderName): string | undefined {
  const credentials = readCredentialsSync();
  return credentials[provider] ?? undefined;
}

export function getApiKey(provider: ProviderName): string | undefined {
  return process.env[envVarName(provider)] ?? readCredential(provider) ?? undefined;
}

export async function applyStoredApiKey(provider: ProviderName): Promise<string | undefined> {
  const envVar = envVarName(provider);
  const key = process.env[envVar] ?? readCredential(provider) ?? undefined;
  if (key && !process.env[envVar]) process.env[envVar] = key;
  return key;
}

export function maskKey(key: string): string {
  return `${key.slice(0, 8)}****`;
}

export function detectAvailableProviders(): ProviderName[] {
  const credentials = readCredentialsSync();
  return PROVIDERS.filter((p) => Boolean(process.env[envVarName(p)] ?? credentials[p]));
}

export function autoDetectProvider(): ProviderName {
  const env = process.env['AZRI_LLM_PROVIDER'];
  if (env && isProvider(env)) return env;
  const available = detectAvailableProviders();
  if (available.length === 0) return 'anthropic';
  if (available.length === 1) return available[0]!;
  if (available.includes('anthropic')) return 'anthropic';
  return available[0]!;
}

export function buildMissingKeyError(requested: ProviderName): string {
  const available = detectAvailableProviders();
  if (available.length === 0) {
    return `no API key configured. Run 'azri auth login' or set ${envVarName(requested)}.`;
  }
  if (available.includes(requested)) {
    return `no API key configured for ${requested}.`;
  }
  const suggestion = available[0]!;
  return `no ${requested} API key configured. You have ${available.join(', ')} saved — try '--provider=${suggestion}'.`;
}
