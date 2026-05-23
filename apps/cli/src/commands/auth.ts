// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createInterface } from 'node:readline/promises';

import type { ProviderName } from '../../../../packages/core/src/index.ts';
import {
  credentialsPath,
  envVarName,
  getApiKey,
  isProvider,
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

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function askHidden(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write('\u001B[8m');
    return (await rl.question(question)).trim();
  } finally {
    process.stdout.write('\u001B[0m\n');
    rl.close();
  }
}

async function pickProvider(): Promise<ProviderName> {
  console.log('Provider:');
  PROVIDERS.forEach((provider, index) => console.log(`  ${index + 1}) ${provider}`));
  const answer = await ask('Choose provider [anthropic/openai/google]: ');
  const numbered = Number.parseInt(answer, 10);
  if (Number.isInteger(numbered) && numbered >= 1 && numbered <= PROVIDERS.length) {
    return PROVIDERS[numbered - 1]!;
  }
  if (isProvider(answer)) return answer;
  throw new Error(`invalid provider '${answer}'`);
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

async function runLogin(): Promise<number> {
  try {
    const provider = await pickProvider();
    const key = await askHidden(`API key for ${provider}: `);
    if (!key) {
      console.error('Error: API key cannot be empty.');
      return 1;
    }
    const validation = await validateKey(provider, key);
    if (!validation.ok) {
      const save = (
        await ask(`Validation failed: ${validation.reason}. Save anyway? (y/N) `)
      ).toLowerCase();
      if (save !== 'y' && save !== 'yes') {
        console.error('Error: credential not saved.');
        return 1;
      }
    }
    await saveCredential(provider, key);
    console.log(`Saved ${provider} credential (${maskKey(key)}) to ${credentialsPath()}`);
    return 0;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function runLogout(args: string[]): Promise<number> {
  try {
    const yes = args.includes('--yes') || args.includes('-y');
    if (!yes) {
      const answer = (
        await ask(`Remove credentials at ${credentialsPath()}? (y/N) `)
      ).toLowerCase();
      if (answer !== 'y' && answer !== 'yes') return 0;
    }
    await removeCredentials();
    console.log('Credentials removed.');
    return 0;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
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
  if (command === 'login') return await runLogin();
  if (command === 'logout') return await runLogout(rest);
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

export const testInternals = { validateKey, getApiKey };
