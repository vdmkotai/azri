// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import * as p from '@clack/prompts';

import type { ProviderName } from '../../../../packages/core/src/index.ts';
import {
  credentialsPath,
  envVarName,
  getApiKey,
  maskKey,
  PROVIDERS,
  readCredentials,
  removeCredentials,
  saveCredential,
} from '../credentials.ts';

interface ValidationResult {
  ok: boolean;
  reason: string;
}

function printAuthHelp(): void {
  console.log(
    [
      'azri auth — manage stored API credentials',
      '',
      'USAGE',
      '  azri auth <login|logout|status|list> [options]',
      '',
      'COMMANDS',
      '  login            Prompt for a provider API key and store it',
      '  logout [--yes]   Remove stored credentials',
      '  status           Show configured providers without printing keys',
      '  list             Alias for status',
    ].join('\n'),
  );
}

function sanitizeKey(raw: string): string {
  return raw.replace(/[^\u0020-\u007E]/gu, '').trim();
}

async function validateKey(provider: ProviderName, key: string): Promise<ValidationResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    let response: Response;
    if (provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'GET',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        signal: controller.signal,
      });
      return response.status === 405 || response.status === 400 || response.status === 200
        ? { ok: true, reason: 'validated' }
        : { ok: false, reason: `HTTP ${response.status}` };
    }
    if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` },
        signal: controller.signal,
      });
    } else {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
        {
          method: 'GET',
          signal: controller.signal,
        },
      );
    }
    return response.ok
      ? { ok: true, reason: 'validated' }
      : { ok: false, reason: `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

function envOverride(): ProviderName | null {
  return PROVIDERS.find((pr) => process.env[envVarName(pr)]) ?? null;
}

async function runLogin(): Promise<number> {
  p.intro('azri · auth');

  const envProvider = envOverride();
  if (envProvider) {
    p.note(
      `${envVarName(envProvider)} is set in your environment.\nRun \`azri auth status\` to inspect.`,
    );
    p.outro('Already configured.');
    return 0;
  }

  const result = await p.group(
    {
      provider: () =>
        p.select<ProviderName>({
          message: 'Which AI provider?',
          options: [
            { value: 'anthropic', label: 'Anthropic' },
            { value: 'openai', label: 'OpenAI' },
            { value: 'google', label: 'Google' },
          ],
        }),
      key: ({ results }) =>
        p.password({
          message: `Paste your ${results.provider} API key`,
          mask: '\u2022',
          validate: (v) => {
            const cleaned = sanitizeKey(v);
            if (cleaned.length < 10) return 'Key looks too short.';
          },
        }),
    },
    {
      onCancel: () => {
        p.cancel('Cancelled.');
        process.exit(0);
      },
    },
  );

  const cleanedKey = sanitizeKey(result.key);

  const s = p.spinner();
  s.start(`Validating ${result.provider} key…`);
  const validation = await validateKey(result.provider, cleanedKey);
  if (validation.ok) {
    s.stop(`✓ ${result.provider} key is valid`);
  } else {
    s.stop(`Validation failed: ${validation.reason}`, 1);
    const save = await p.confirm({ message: 'Save anyway?', initialValue: false });
    if (p.isCancel(save) || !save) {
      p.cancel('Not saved.');
      return 1;
    }
  }

  await saveCredential(result.provider, cleanedKey);
  p.outro(`Saved ${result.provider} (${maskKey(cleanedKey)}) to ${credentialsPath()}`);
  return 0;
}

async function runLogout(args: string[]): Promise<number> {
  const yes = args.includes('--yes') || args.includes('-y');
  if (!yes) {
    p.intro('azri · logout');
    const confirmed = await p.confirm({
      message: `Remove credentials at ${credentialsPath()}?`,
      initialValue: false,
    });
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Cancelled.');
      return 0;
    }
  }
  await removeCredentials();
  if (yes) console.log('Credentials removed.');
  else p.outro('Credentials removed.');
  return 0;
}

export async function printAuthStatus(): Promise<void> {
  const credentials = await readCredentials();
  console.log(`Credentials file: ${credentialsPath()}`);
  for (const provider of PROVIDERS) {
    const envVar = envVarName(provider);
    const envKey = process.env[envVar];
    const fileKey = credentials[provider];
    const source = envKey
      ? `env (${envVar}) overrides stored credential`
      : fileKey
        ? 'stored'
        : 'missing';
    const detail = envKey ?? fileKey;
    console.log(`${provider}: ${source}${detail ? ` (${maskKey(detail)})` : ''}`);
  }
}

export async function runAuth(args: string[]): Promise<number> {
  const [command, ...rest] = args;
  if (!command || command === '--help' || command === '-h') {
    printAuthHelp();
    return 0;
  }
  if (command === 'login') {
    try {
      return await runLogin();
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }
  if (command === 'logout') {
    try {
      return await runLogout(rest);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }
  if (command === 'status' || command === 'list') {
    try {
      await printAuthStatus();
      return 0;
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }
  console.error(`Error: unknown auth command '${command}'`);
  return 1;
}

export const testInternals = { validateKey, getApiKey, sanitizeKey };
