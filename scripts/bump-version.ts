// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const CLI_PKG_PATH = resolve(REPO_ROOT, 'apps/cli/package.json');

const BUMP_KINDS = ['patch', 'minor', 'major'] as const;
type BumpKind = (typeof BUMP_KINDS)[number];

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/u;

export interface BumpResult {
  readonly previous: string;
  readonly next: string;
  readonly kind: BumpKind;
  readonly pkgPath: string;
}

function isBumpKind(value: string): value is BumpKind {
  return (BUMP_KINDS as readonly string[]).includes(value);
}

function nextVersion(current: string, kind: BumpKind): string {
  const match = SEMVER_RE.exec(current);
  if (!match) {
    throw new Error(`[bump-version] current version "${current}" is not plain SemVer (x.y.z)`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  switch (kind) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

export async function bumpCliVersion(kind: BumpKind): Promise<BumpResult> {
  const raw = await readFile(CLI_PKG_PATH, 'utf8');
  const pkg = JSON.parse(raw) as { version?: string };
  const previous = pkg.version;
  if (typeof previous !== 'string' || previous.length === 0) {
    throw new Error(`[bump-version] missing "version" in ${CLI_PKG_PATH}`);
  }
  const next = nextVersion(previous, kind);
  const trailing = raw.endsWith('\n') ? '\n' : '';
  const updated = JSON.stringify({ ...pkg, version: next }, null, 2) + trailing;
  await writeFile(CLI_PKG_PATH, updated, 'utf8');
  return { previous, next, kind, pkgPath: CLI_PKG_PATH };
}

async function gitAdd(pkgPath: string): Promise<void> {
  const result = await Bun.$`git add ${pkgPath}`.nothrow().quiet();
  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(`[bump-version] git add failed: ${stderr || 'unknown error'}`);
  }
}

async function main(argv: readonly string[]): Promise<number> {
  const [, , kindArg] = argv;
  if (!kindArg || !isBumpKind(kindArg)) {
    console.error('[bump-version] usage: bun run scripts/bump-version.ts <patch|minor|major>');
    return 1;
  }
  const result = await bumpCliVersion(kindArg);
  await gitAdd(result.pkgPath);
  console.log(`[bump-version] ${result.previous} -> ${result.next} (${result.kind})`);
  console.log(`[bump-version] staged: ${result.pkgPath}`);
  return 0;
}

const isMain = import.meta.path === Bun.main;
if (isMain) {
  try {
    const code = await main(process.argv);
    process.exit(code);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
