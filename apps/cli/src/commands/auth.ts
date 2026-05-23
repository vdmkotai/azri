// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors
/* eslint-disable max-lines */

import * as p from '@clack/prompts';

import type { ProviderName } from '../../../../packages/core/src/index.ts';
import {
  credentialsPath,
  envVarName,
  getApiKey,
  getStoredDefault,
  isProvider,
  maskKey,
  PROVIDERS,
  readCredentials,
  removeCredentials,
  saveCredential,
  setDefaultProvider,
  writeCredentials,
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
      '  azri auth <login|logout|status|list|default> [options]',
      '',
      'COMMANDS',
      '  login            Prompt for a provider API key and store it',
      '  default [provider]   Set or pick the default provider',
      '  logout [--yes]   Remove stored credentials',
      '  status           Show configured providers without printing keys',
      '  list             Alias for status',
    ].join('\n'),
  );
}

function providerLabel(provider: ProviderName): string {
  return { anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google' }[provider];
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
  const credentials = await readCredentials();
  const allSaved = PROVIDERS.filter((provider) => credentials[provider]);
  if (allSaved.length === 1) {
    credentials.default = result.provider;
    await writeCredentials(credentials);
    p.outro(`${providerLabel(result.provider)} is your default provider.`);
    return 0;
  }

  const currentDefault = getStoredDefault();
  const newDefault = await p.select<ProviderName>({
    message: 'Choose default provider',
    options: allSaved.map((provider) => ({
      value: provider,
      label: providerLabel(provider),
      hint: provider === currentDefault ? 'current default' : undefined,
    })),
    initialValue: currentDefault ?? result.provider,
  });
  if (p.isCancel(newDefault)) {
    p.cancel('Cancelled.');
    return 0;
  }
  await setDefaultProvider(newDefault);
  p.outro(`Saved. Default: ${newDefault}.`);
  return 0;
}

async function runDefault(args: string[]): Promise<number> {
  const requested = args[0];
  const credentials = await readCredentials();
  const saved = PROVIDERS.filter((provider) => credentials[provider]);
  if (saved.length === 0) {
    console.error('Error: no providers configured. Run `azri auth login` first.');
    return 1;
  }
  if (requested) {
    if (!isProvider(requested)) {
      console.error(`Error: invalid provider '${requested}'. Choose ${PROVIDERS.join(', ')}.`);
      return 1;
    }
    if (!saved.includes(requested)) {
      console.error(`Error: no ${requested} key configured — run 'azri auth login' first.`);
      return 1;
    }
    await setDefaultProvider(requested);
    console.log(`Default provider set to ${requested}.`);
    return 0;
  }

  p.intro('azri · default provider');
  const current = getStoredDefault();
  const choice = await p.select<ProviderName>({
    message: 'Choose default provider',
    options: saved.map((provider) => ({
      value: provider,
      label: providerLabel(provider),
      hint: provider === current ? 'current default' : undefined,
    })),
    initialValue: current ?? saved[0]!,
  });
  if (p.isCancel(choice)) {
    p.cancel('Cancelled.');
    return 0;
  }
  await setDefaultProvider(choice);
  p.outro(`Default set to ${choice}.`);
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
  console.log(
    `Credentials file: ${credentialsPath()}${credentials.default ? `  ·  default: ${credentials.default}` : ''}`,
  );
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
    const isDefault = provider === credentials.default;
    console.log(
      `${isDefault ? '★ ' : '  '}${provider}: ${source}${detail ? ` (${maskKey(detail)})` : ''}`,
    );
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
  if (command === 'default') {
    try {
      return await runDefault(rest);
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

export const testInternals = { validateKey, getApiKey, sanitizeKey, runDefault, providerLabel };
