// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import * as p from '@clack/prompts';

import type { ProviderName } from '../../../../packages/core/src/index.ts';
import { PRESET_NAMES, PRESETS } from '../../../../packages/renderer/src/design-system/index.ts';
import { AzriConfigSchema, type Verbosity } from '../../../../packages/types/src/index.ts';
import { credentialsPath, envVarName, maskKey, PROVIDERS, saveCredential } from '../credentials.ts';
import { swatchRow } from '../ui/swatch.ts';
import { runDoctorChecks, type CheckResult } from './doctor.ts';

const THEME_DESCRIPTIONS: Record<string, string> = {
  default: 'neutral baseline',
  'github-dark': 'dark mode, GitHub palette',
  'vscode-modern': 'light, dense, Inter+Cascadia',
  sepia: 'warm cream, serif-forward',
  brutalist: 'high-contrast, no shadows',
};

function presetSwatches(name: string): string {
  const preset = PRESETS[name];
  if (!preset) return '';
  return swatchRow(preset.swatches);
}

function themeLabel(name: string): string {
  const padded = name.padEnd(14);
  const swatches = presetSwatches(name);
  const desc = THEME_DESCRIPTIONS[name] ?? '';
  return `${padded}  ${swatches}   ${desc}`;
}

function buildThemeOptions(): Array<{ value: string; label: string }> {
  return PRESET_NAMES.map((name) => ({ value: name, label: themeLabel(name) }));
}

function buildVerbosityOptions(): Array<{ value: Verbosity; label: string }> {
  return [
    { value: 'concise', label: 'concise   3-4 sections, cheaper' },
    { value: 'standard', label: 'standard  4-6 sections (recommended)' },
    { value: 'detailed', label: 'detailed  5-7 sections, ~3x cost' },
  ];
}

function buildProviderOptions(): Array<{ value: ProviderName; label: string }> {
  return [
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'google', label: 'Google' },
  ];
}

function sanitizeKey(raw: string): string {
  return raw.replace(/[^\u0020-\u007E]/gu, '').trim();
}

function configPath(cwd: string): string {
  return join(cwd, '.azri', 'config.json');
}

async function readExistingConfig(path: string): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}

export interface InitConfigUpdate {
  theme: string;
  verbosity: Verbosity;
}

export async function writeInitConfig(cwd: string, update: InitConfigUpdate): Promise<string> {
  const path = configPath(cwd);
  const existing = await readExistingConfig(path);
  const merged = { ...existing, theme: update.theme, verbosity: update.verbosity };
  const validated = AzriConfigSchema.parse(merged);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(validated, null, 2)}\n`, { mode: 0o644 });
  return path;
}

async function validateProviderKey(
  provider: ProviderName,
  key: string,
): Promise<{ ok: boolean; reason: string }> {
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
        { method: 'GET', signal: controller.signal },
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

function printDoctorCheck(check: CheckResult): void {
  const line = `${check.status.padEnd(4)}  ${check.name.padEnd(24)}  ${check.reason}`;
  if (check.status === 'PASS') p.log.success(line);
  else if (check.status === 'WARN') p.log.warn(line);
  else p.log.error(line);
}

function printInitHelp(): void {
  console.log(
    [
      'azri init — first-run setup wizard',
      '',
      'USAGE',
      '  azri init',
      '',
      'Configures default theme, verbosity, and optionally an AI provider.',
      'Writes ./.azri/config.json in the current directory.',
    ].join('\n'),
  );
}

function envProviderName(): ProviderName | null {
  return PROVIDERS.find((pr) => process.env[envVarName(pr)]) ?? null;
}

export async function runInit(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    printInitHelp();
    return 0;
  }

  try {
    p.intro('azri · setup');

    const cwd = process.cwd();
    const existing = await readExistingConfig(configPath(cwd));
    const currentTheme =
      typeof existing['theme'] === 'string' ? (existing['theme'] as string) : 'default';
    const initialTheme = PRESET_NAMES.includes(currentTheme) ? currentTheme : 'default';
    const currentVerbosity =
      existing['verbosity'] === 'concise' ||
      existing['verbosity'] === 'standard' ||
      existing['verbosity'] === 'detailed'
        ? (existing['verbosity'] as Verbosity)
        : 'standard';

    const envProvider = envProviderName();

    const baseResult = await p.group(
      {
        theme: () =>
          p.select<string>({
            message: 'Default theme',
            options: buildThemeOptions(),
            initialValue: initialTheme,
          }),
        verbosity: () =>
          p.select<Verbosity>({
            message: 'Default verbosity',
            options: buildVerbosityOptions(),
            initialValue: currentVerbosity,
          }),
        setupAuth: () =>
          p.confirm({
            message: envProvider
              ? `${envVarName(envProvider)} is already set. Set up another provider?`
              : 'Set up an AI provider now?',
            initialValue: !envProvider,
          }),
      },
      {
        onCancel: () => {
          p.cancel('Cancelled.');
          process.exit(0);
        },
      },
    );

    const configPathWritten = await writeInitConfig(cwd, {
      theme: baseResult.theme,
      verbosity: baseResult.verbosity,
    });

    if (baseResult.setupAuth) {
      const authResult = await p.group(
        {
          provider: () =>
            p.select<ProviderName>({
              message: 'Which AI provider?',
              options: buildProviderOptions(),
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

      const cleanedKey = sanitizeKey(authResult.key);
      const s = p.spinner();
      s.start(`Validating ${authResult.provider} key…`);
      const validation = await validateProviderKey(authResult.provider, cleanedKey);
      if (validation.ok) {
        s.stop(`✓ ${authResult.provider} key is valid`);
        await saveCredential(authResult.provider, cleanedKey);
        p.log.info(`Saved ${authResult.provider} (${maskKey(cleanedKey)}) to ${credentialsPath()}`);
      } else {
        s.stop(`Validation failed: ${validation.reason}`, 1);
        const save = await p.confirm({ message: 'Save anyway?', initialValue: false });
        if (p.isCancel(save) || !save) {
          p.log.warn('Credential not saved.');
        } else {
          await saveCredential(authResult.provider, cleanedKey);
          p.log.info(
            `Saved ${authResult.provider} (${maskKey(cleanedKey)}) to ${credentialsPath()}`,
          );
        }
      }
    } else if (!envProvider) {
      p.log.info('Later — set ANTHROPIC_API_KEY (or run `azri auth login`).');
    }

    const doctorChoice = await p.confirm({
      message: 'Run diagnostic checks?',
      initialValue: true,
    });
    if (!p.isCancel(doctorChoice) && doctorChoice) {
      const checks = await runDoctorChecks();
      for (const check of checks) printDoctorCheck(check);
    }

    p.outro(
      `All set. Try: azri pr https://github.com/owner/repo/pull/1\nConfig: ${configPathWritten}`,
    );
    return 0;
  } catch (error) {
    p.cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

export const testInternals = {
  themeLabel,
  buildThemeOptions,
  buildVerbosityOptions,
  buildProviderOptions,
  sanitizeKey,
  writeInitConfig,
  envProviderName,
};
