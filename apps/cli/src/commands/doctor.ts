// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { access, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { $ } from 'bun';

import type { ProviderName } from '../../../../packages/core/src/index.ts';
import {
  credentialsMode,
  credentialsPath,
  envVarName,
  getApiKey,
  PROVIDERS,
  readCredentials,
  selectedProvider,
} from '../credentials.ts';

type CheckStatus = 'PASS' | 'WARN' | 'FAIL';

interface CheckResult {
  status: CheckStatus;
  name: string;
  reason: string;
}

function result(status: CheckStatus, name: string, reason: string): CheckResult {
  return { status, name, reason };
}

function print(check: CheckResult): void {
  console.log(`${check.status.padEnd(4)}  ${check.name}  ${check.reason}`);
}

async function checkGitConfig(): Promise<CheckResult> {
  try {
    const email = (await $`git config user.email`.quiet().text()).trim();
    return email
      ? result('PASS', 'Git config', 'user.email is set')
      : result('FAIL', 'Git config', 'user.email is empty');
  } catch {
    return result('FAIL', 'Git config', 'git config user.email failed');
  }
}

async function checkCredentialsFile(): Promise<CheckResult> {
  const credentials = await readCredentials();
  const hasStored = PROVIDERS.some((provider) => !!credentials[provider]);
  const hasEnv = PROVIDERS.some((provider) => !!process.env[envVarName(provider)]);
  if (hasStored)
    return result('PASS', 'Credentials file', 'at least one provider credential is stored');
  if (hasEnv) return result('WARN', 'Credentials file', 'missing, but provider env vars are set');
  return result('FAIL', 'Credentials file', 'no stored credentials or provider env vars found');
}

async function checkCredentialPermissions(): Promise<CheckResult> {
  const mode = await credentialsMode();
  if (mode === null)
    return result('WARN', 'Credentials permissions', 'credentials file is missing');
  if ((mode & 0o077) !== 0)
    return result('FAIL', 'Credentials permissions', `mode ${mode.toString(8)} is too open`);
  return result('PASS', 'Credentials permissions', `mode ${mode.toString(8)}`);
}

async function checkOutputDirectory(): Promise<CheckResult> {
  const dir = './azri-out';
  const probe = join(dir, `.doctor-${process.pid}`);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(probe, 'ok', 'utf8');
    await rm(probe);
    return result('PASS', 'Output directory', './azri-out/ is writable');
  } catch (error) {
    return result(
      'FAIL',
      'Output directory',
      error instanceof Error ? error.message : String(error),
    );
  }
}

function providerReachabilityRequest(
  provider: ProviderName,
  key: string,
): RequestInit & { url: string } {
  if (provider === 'anthropic') {
    return {
      url: 'https://api.anthropic.com/v1/models',
      method: 'HEAD',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    };
  }
  if (provider === 'openai') {
    return {
      url: 'https://api.openai.com/v1/models',
      method: 'HEAD',
      headers: { Authorization: `Bearer ${key}` },
    };
  }
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
    method: 'HEAD',
  };
}

async function checkProviderReachability(provider: ProviderName): Promise<CheckResult> {
  const key = getApiKey(provider);
  if (!key) return result('FAIL', 'Provider reachability', `no ${provider} API key configured`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const request = providerReachabilityRequest(provider, key);
    const response = await fetch(request.url, { ...request, signal: controller.signal });
    if (response.status < 500)
      return result(
        'PASS',
        'Provider reachability',
        `${provider} responded with HTTP ${response.status}`,
      );
    return result(
      'FAIL',
      'Provider reachability',
      `${provider} responded with HTTP ${response.status}`,
    );
  } catch (error) {
    return result(
      'FAIL',
      'Provider reachability',
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function runDoctor(): Promise<number> {
  const provider = selectedProvider();
  const checks: CheckResult[] = [
    result(
      process.versions.bun ? 'PASS' : 'FAIL',
      'Bun runtime',
      process.versions.bun ? `Bun ${process.versions.bun}` : 'not running under Bun',
    ),
    await checkGitConfig(),
    await checkCredentialsFile(),
    await checkCredentialPermissions(),
    await checkOutputDirectory(),
    await checkProviderReachability(provider),
  ];
  for (const check of checks) print(check);
  return checks.filter((check) => check.status === 'FAIL').length;
}

export const testInternals = {
  checkCredentialsFile,
  checkCredentialPermissions,
  checkOutputDirectory,
  checkProviderReachability,
  providerReachabilityRequest,
  credentialsPath,
  access,
  stat,
};
