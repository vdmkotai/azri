// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { ChangedFile } from '@azri/types';

const GENERATED_EXACT_NAMES = new Set<string>([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lock',
  'bun.lockb',
  'composer.lock',
  'Gemfile.lock',
  'poetry.lock',
  'Cargo.lock',
  'go.sum',
  'Pipfile.lock',
]);

const GENERATED_SUFFIXES = ['.min.js', '.min.css', '.snap', '.lock', '.tgz', '.map'];

const GENERATED_DIR_PREFIXES = [
  'dist/',
  'build/',
  'vendor/',
  'node_modules/',
  '.next/',
  '.nuxt/',
  '.turbo/',
  'coverage/',
  '__generated__/',
];

/**
 * Return true when the path matches a generated/lockfile heuristic.
 * Path-only heuristic; does NOT read file contents.
 */
export function isGenerated(path: string): boolean {
  if (!path) return false;

  const normalized = path.replace(/\\/gu, '/');
  const base = normalized.slice(normalized.lastIndexOf('/') + 1);

  if (GENERATED_EXACT_NAMES.has(base)) return true;

  for (const suffix of GENERATED_SUFFIXES) {
    if (normalized.endsWith(suffix)) return true;
  }

  for (const prefix of GENERATED_DIR_PREFIXES) {
    if (normalized === prefix.replace(/\/$/u, '')) return true;
    if (normalized.startsWith(prefix)) return true;
    if (normalized.includes(`/${prefix}`)) return true;
  }

  return false;
}

/**
 * Detect git submodule pointer changes. A submodule diff in git looks like:
 *   -Subproject commit <oldSha>
 *   +Subproject commit <newSha>
 * Treat any patch containing a `Subproject commit <hex>` line as a submodule change.
 */
export function isSubmoduleChange(file: { patch?: string | null }): boolean {
  if (!file.patch) return false;
  return /Subproject commit [0-9a-f]+/u.test(file.patch);
}

/**
 * Return true when the file should be skipped from analysis entirely.
 * Currently combines generated/binary/submodule heuristics.
 */
export function shouldSkip(file: ChangedFile): boolean {
  if (file.isGenerated) return true;
  if (file.isBinary) return true;
  if (isGenerated(file.path)) return true;
  if (isSubmoduleChange(file)) return true;
  return false;
}
