// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function repoPath(...parts: string[]): string {
  return path.join(process.cwd(), ...parts);
}

export async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T;
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function safeTimestamp(date = new Date()): string {
  return date.toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

export async function latestProviderRun(provider?: string): Promise<string | null> {
  const root = repoPath('evals', 'runs');
  let timestamps: string[];
  try {
    timestamps = (await readdir(root)).toSorted().toReversed();
  } catch {
    return null;
  }

  for (const timestamp of timestamps) {
    const timestampDir = path.join(root, timestamp);
    if (!(await isDirectory(timestampDir))) continue;
    if (provider) {
      const providerDir = path.join(timestampDir, provider);
      if (await isDirectory(providerDir)) return providerDir;
      continue;
    }
    const providers = (await readdir(timestampDir)).toSorted();
    for (const name of providers) {
      const providerDir = path.join(timestampDir, name);
      if (await isDirectory(providerDir)) return providerDir;
    }
  }
  return null;
}

async function isDirectory(file: string): Promise<boolean> {
  try {
    return (await stat(file)).isDirectory();
  } catch {
    return false;
  }
}
