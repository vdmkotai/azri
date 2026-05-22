// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { resolve } from 'node:path';

import { bumpCliVersion } from './bump-version.ts';

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const CLI_DIST_INDEX = resolve(REPO_ROOT, 'apps/cli/dist/index.js');
const CLI_PKG_PATH = resolve(REPO_ROOT, 'apps/cli/package.json');

const BUMP_KINDS = ['patch', 'minor', 'major'] as const;
type BumpKind = (typeof BUMP_KINDS)[number];

function isBumpKind(value: string): value is BumpKind {
  return (BUMP_KINDS as readonly string[]).includes(value);
}

class ReleaseError extends Error {
  constructor(
    message: string,
    readonly step: string,
  ) {
    super(message);
    this.name = 'ReleaseError';
  }
}

async function ensureCleanWorkingTree(): Promise<void> {
  const result = await Bun.$`git status --porcelain`.cwd(REPO_ROOT).nothrow().quiet();
  if (result.exitCode !== 0) {
    throw new ReleaseError(
      `git status failed: ${result.stderr.toString().trim()}`,
      'preflight:git-status',
    );
  }
  const dirty = result.stdout.toString().trim();
  if (dirty.length > 0) {
    throw new ReleaseError(
      `working tree is dirty; commit or stash first:\n${dirty}`,
      'preflight:dirty-tree',
    );
  }
}

async function runStep(step: string, cmd: string, args: readonly string[]): Promise<void> {
  console.log(`\n[release] >>> ${step}: ${cmd} ${args.join(' ')}`);
  const proc = Bun.spawn([cmd, ...args], {
    cwd: REPO_ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new ReleaseError(`${cmd} ${args.join(' ')} exited ${exitCode}`, step);
  }
}

async function smokeBuiltCli(expectedVersion: string): Promise<void> {
  const exists = await Bun.file(CLI_DIST_INDEX).exists();
  if (!exists) {
    throw new ReleaseError(`built CLI not found at ${CLI_DIST_INDEX}`, 'smoke:missing-dist');
  }
  const result = await Bun.$`${CLI_DIST_INDEX} --version`.nothrow().quiet();
  if (result.exitCode !== 0) {
    throw new ReleaseError(
      `built CLI --version exited ${result.exitCode}: ${result.stderr.toString().trim()}`,
      'smoke:exec',
    );
  }
  const printed = result.stdout.toString().trim();
  if (printed !== expectedVersion) {
    throw new ReleaseError(
      `built CLI printed version ${JSON.stringify(printed)}, expected ${JSON.stringify(expectedVersion)}`,
      'smoke:version-mismatch',
    );
  }
  console.log(`[release] smoke ok: dist/index.js --version => ${printed}`);
}

async function gitCommit(version: string): Promise<void> {
  const message = `chore(release): azri v${version}`;
  const result = await Bun.$`git commit -s -m ${message} -- ${CLI_PKG_PATH}`
    .cwd(REPO_ROOT)
    .nothrow();
  if (result.exitCode !== 0) {
    throw new ReleaseError(
      `git commit failed: ${result.stderr.toString().trim() || result.stdout.toString().trim()}`,
      'git:commit',
    );
  }
  console.log(`[release] committed: ${message}`);
}

async function gitTag(version: string): Promise<void> {
  const tag = `azri@${version}`;
  const exists = await Bun.$`git rev-parse -q --verify refs/tags/${tag}`
    .cwd(REPO_ROOT)
    .nothrow()
    .quiet();
  if (exists.exitCode === 0) {
    throw new ReleaseError(`git tag ${tag} already exists`, 'git:tag-exists');
  }
  const result = await Bun.$`git tag -a ${tag} -m ${`Release ${tag}`}`.cwd(REPO_ROOT).nothrow();
  if (result.exitCode !== 0) {
    throw new ReleaseError(`git tag failed: ${result.stderr.toString().trim()}`, 'git:tag');
  }
  console.log(`[release] tagged: ${tag}`);
}

async function gitPushTags(): Promise<void> {
  const result = await Bun.$`git push --follow-tags`.cwd(REPO_ROOT).nothrow();
  if (result.exitCode !== 0) {
    throw new ReleaseError(
      `git push --follow-tags failed: ${result.stderr.toString().trim()}`,
      'git:push',
    );
  }
  console.log('[release] pushed: branch + tags');
}

async function main(argv: readonly string[]): Promise<number> {
  const [, , kindArg] = argv;
  if (!kindArg || !isBumpKind(kindArg)) {
    console.error('[release] usage: bun run scripts/release.ts <patch|minor|major>');
    return 1;
  }

  console.log(`[release] starting ${kindArg} release in ${REPO_ROOT}`);
  await ensureCleanWorkingTree();

  const bump = await bumpCliVersion(kindArg);
  console.log(`[release] bumped ${bump.previous} -> ${bump.next} (${bump.kind})`);

  try {
    await runStep('build', 'bun', ['run', 'scripts/build-cli.ts']);
    await smokeBuiltCli(bump.next);
    await gitCommit(bump.next);
    await gitTag(bump.next);
    await gitPushTags();
  } catch (err) {
    console.error(`\n[release] FAILED at ${(err as ReleaseError).step ?? 'unknown'}`);
    console.error(err instanceof Error ? err.message : String(err));
    console.error(
      '\n[release] partial state: package.json bumped + staged but commit/tag may be incomplete.',
    );
    console.error('[release] inspect with `git status` and roll back manually if needed.');
    return 1;
  }

  console.log(`\n[release] done: azri@${bump.next}`);
  console.log('[release] GitHub Actions will publish on push of tag `azri@' + bump.next + '`.');
  return 0;
}

try {
  const code = await main(process.argv);
  process.exit(code);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
