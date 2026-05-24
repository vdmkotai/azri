// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { testInternals } from '../src/commands/init.ts';

let workdir: string;

beforeEach(async () => {
  workdir = await mkdtemp(join(tmpdir(), 'azri-journal-init-test-'));
});

afterEach(async () => {
  await rm(workdir, { recursive: true, force: true });
});

async function readProjectFile(path: string): Promise<string> {
  return await readFile(join(workdir, path), 'utf8');
}

function expectInitialized(content: string): void {
  expect(content).toContain(testInternals.JOURNAL_HEADER);
  expect(content).toContain('`.azri/sessions/<branch-name>.md`');
}

describe('journal init rules-file selection', () => {
  test('only AGENTS.md exists -> modifies AGENTS.md', async () => {
    await writeFile(join(workdir, 'AGENTS.md'), '# Agents\n');

    const result = await testInternals.initializeJournalRules(workdir);

    expect(result.targetFiles).toEqual(['AGENTS.md']);
    expect(result.insertedFiles).toEqual(['AGENTS.md']);
    expectInitialized(await readProjectFile('AGENTS.md'));
    expect(await Bun.file(join(workdir, 'CLAUDE.md')).exists()).toBe(false);
  });

  test('only CLAUDE.md exists -> modifies CLAUDE.md', async () => {
    await writeFile(join(workdir, 'CLAUDE.md'), '# Claude\n');

    const result = await testInternals.initializeJournalRules(workdir);

    expect(result.targetFiles).toEqual(['CLAUDE.md']);
    expect(result.insertedFiles).toEqual(['CLAUDE.md']);
    expectInitialized(await readProjectFile('CLAUDE.md'));
    expect(await Bun.file(join(workdir, 'AGENTS.md')).exists()).toBe(false);
  });

  test('CLAUDE.md pointer to AGENTS.md -> modifies AGENTS.md only', async () => {
    await writeFile(join(workdir, 'AGENTS.md'), '# Agents\n');
    await writeFile(join(workdir, 'CLAUDE.md'), 'See AGENTS.md for project rules\n');

    const result = await testInternals.initializeJournalRules(workdir);

    expect(result.targetFiles).toEqual(['AGENTS.md']);
    expect(result.insertedFiles).toEqual(['AGENTS.md']);
    expectInitialized(await readProjectFile('AGENTS.md'));
    expect(await readProjectFile('CLAUDE.md')).toBe('See AGENTS.md for project rules\n');
  });

  test('AGENTS.md pointer to CLAUDE.md -> modifies CLAUDE.md only', async () => {
    await writeFile(join(workdir, 'AGENTS.md'), 'Follow CLAUDE.md\n');
    await writeFile(join(workdir, 'CLAUDE.md'), '# Claude\n');

    const result = await testInternals.initializeJournalRules(workdir);

    expect(result.targetFiles).toEqual(['CLAUDE.md']);
    expect(result.insertedFiles).toEqual(['CLAUDE.md']);
    expect(await readProjectFile('AGENTS.md')).toBe('Follow CLAUDE.md\n');
    expectInitialized(await readProjectFile('CLAUDE.md'));
  });

  test('both independent -> modifies both', async () => {
    const agentsRules = Array.from({ length: 31 }, () => 'agent rule').join('\n');
    const claudeRules = Array.from({ length: 31 }, () => 'claude rule').join('\n');
    await writeFile(join(workdir, 'AGENTS.md'), `${agentsRules}\n`);
    await writeFile(join(workdir, 'CLAUDE.md'), `${claudeRules}\n`);

    const result = await testInternals.initializeJournalRules(workdir);

    expect(result.targetFiles).toEqual(['AGENTS.md', 'CLAUDE.md']);
    expect(result.insertedFiles).toEqual(['AGENTS.md', 'CLAUDE.md']);
    expectInitialized(await readProjectFile('AGENTS.md'));
    expectInitialized(await readProjectFile('CLAUDE.md'));
  });

  test('neither exists -> creates AGENTS.md', async () => {
    const result = await testInternals.initializeJournalRules(workdir);

    expect(result.targetFiles).toEqual(['AGENTS.md']);
    expect(result.insertedFiles).toEqual(['AGENTS.md']);
    expectInitialized(await readProjectFile('AGENTS.md'));
    expect(await Bun.file(join(workdir, 'CLAUDE.md')).exists()).toBe(false);
  });
});

describe('journal init idempotency and side effects', () => {
  test('already initialized -> idempotent no-op for rules block', async () => {
    const originalAgents = `# Agents\n${testInternals.JOURNAL_RULES_BLOCK}`;
    await writeFile(join(workdir, 'AGENTS.md'), originalAgents);

    const result = await testInternals.initializeJournalRules(workdir);

    expect(result.insertedFiles).toEqual([]);
    expect(result.alreadyInitializedFiles).toEqual(['AGENTS.md']);
    expect(await readProjectFile('AGENTS.md')).toBe(originalAgents);
  });

  test('.gitignore append works and is idempotent', async () => {
    await writeFile(join(workdir, 'AGENTS.md'), '# Agents\n');
    await writeFile(join(workdir, '.gitignore'), 'node_modules/\n');

    const first = await testInternals.initializeJournalRules(workdir);
    const second = await testInternals.initializeJournalRules(workdir);
    const gitignore = await readProjectFile('.gitignore');

    expect(first.addedGitignoreEntry).toBe(true);
    expect(second.addedGitignoreEntry).toBe(false);
    expect(gitignore.match(/^\.azri\/sessions\/$/gmu)?.length).toBe(1);
  });

  test('.gitignore is created when absent', async () => {
    await writeFile(join(workdir, 'AGENTS.md'), '# Agents\n');

    const result = await testInternals.initializeJournalRules(workdir);

    expect(result.addedGitignoreEntry).toBe(true);
    expect(await readProjectFile('.gitignore')).toBe('.azri/sessions/\n');
  });

  test('.azri/sessions/ is created', async () => {
    await writeFile(join(workdir, 'AGENTS.md'), '# Agents\n');

    await testInternals.initializeJournalRules(workdir);

    expect((await stat(join(workdir, '.azri', 'sessions'))).isDirectory()).toBe(true);
  });
});
