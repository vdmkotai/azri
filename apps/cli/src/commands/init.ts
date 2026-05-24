// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as p from '@clack/prompts';

const AGENTS_FILE = 'AGENTS.md';
const CLAUDE_FILE = 'CLAUDE.md';
const JOURNAL_HEADER = '## Azri Journal — record your reasoning while you work';
const SESSIONS_IGNORE_ENTRY = '.azri/sessions/';

const JOURNAL_RULES_BLOCK = [
  '',
  JOURNAL_HEADER,
  '',
  'When you make non-trivial changes to this repo, keep a running journal at',
  '`.azri/sessions/<branch-name>.md` (replace `<branch-name>` with the actual',
  'git branch). Azri reads this file at PR-explainer time to reconstruct the',
  'real debugging journey instead of guessing from the diff.',
  '',
  '**When to write an entry**:',
  '- After testing a hypothesis (whether confirmed or disproved — disproved',
  '  entries are especially valuable)',
  '- After reading meaningful code that informed a decision',
  '- After running a DB query, log query, or other investigation step',
  '- After consulting a subagent (Oracle, librarian, explore, etc.)',
  '- Before commit — write a brief summary entry tying the journey together',
  '',
  '**Entry format** (markdown, one entry per investigation step):',
  '',
  '```markdown',
  '## <ISO-timestamp> — <short hypothesis title>',
  '- **Investigated**: what you were checking (1 sentence)',
  '- **Files**: comma-separated paths with optional line ranges',
  '- **Queries**: any DB / API queries you ran (optional)',
  '- **Result**: what you found (1-2 sentences)',
  '- **Verdict**: ✅ confirmed | ❌ disproved | 🤔 inconclusive',
  '```',
  '',
  'The file is git-ignored by default — your reasoning stays local until you',
  'decide otherwise. To share with the Azri bot or your team, remove the',
  '`.azri/sessions/` entry from `.gitignore` and commit the journal.',
  '',
].join('\n');

type RulesFileName = typeof AGENTS_FILE | typeof CLAUDE_FILE;

interface RulesFileState {
  name: RulesFileName;
  exists: boolean;
  content: string;
}

export interface InitJournalResult {
  foundMessage: string;
  targetFiles: RulesFileName[];
  insertedFiles: RulesFileName[];
  alreadyInitializedFiles: RulesFileName[];
  createdSessionsDir: boolean;
  addedGitignoreEntry: boolean;
  newLineCount: number;
}

async function readRulesFile(cwd: string, name: RulesFileName): Promise<RulesFileState> {
  try {
    return { name, exists: true, content: await readFile(join(cwd, name), 'utf8') };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { name, exists: false, content: '' };
    }
    throw error;
  }
}

function isPointerTo(content: string, targetFile: RulesFileName): boolean {
  if (content.split(/\r?\n/u).length > 30) return false;
  return content.includes(targetFile);
}

function selectTargetFiles(agents: RulesFileState, claude: RulesFileState): RulesFileName[] {
  if (agents.exists && !claude.exists) return [AGENTS_FILE];
  if (!agents.exists && claude.exists) return [CLAUDE_FILE];
  if (!agents.exists && !claude.exists) return [AGENTS_FILE];
  if (isPointerTo(claude.content, AGENTS_FILE)) return [AGENTS_FILE];
  if (isPointerTo(agents.content, CLAUDE_FILE)) return [CLAUDE_FILE];
  return [AGENTS_FILE, CLAUDE_FILE];
}

function foundMessage(agents: RulesFileState, claude: RulesFileState): string {
  if (agents.exists && !claude.exists) return `Found ${AGENTS_FILE}`;
  if (!agents.exists && claude.exists) return `Found ${CLAUDE_FILE}`;
  if (!agents.exists && !claude.exists) return `No ${AGENTS_FILE} or ${CLAUDE_FILE} found`;
  if (isPointerTo(claude.content, AGENTS_FILE)) {
    return `Found ${AGENTS_FILE} (${CLAUDE_FILE} is a pointer to it)`;
  }
  if (isPointerTo(agents.content, CLAUDE_FILE)) {
    return `Found ${CLAUDE_FILE} (${AGENTS_FILE} is a pointer to it)`;
  }
  return `Found ${AGENTS_FILE} and ${CLAUDE_FILE}`;
}

async function readTextIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function writeRulesBlock(cwd: string, file: RulesFileName): Promise<'inserted' | 'already'> {
  const path = join(cwd, file);
  const existing = await readTextIfExists(path);
  if (existing?.includes(JOURNAL_HEADER)) return 'already';

  const prefix = existing ?? '# Project Rules\n';
  await writeFile(path, `${prefix}${JOURNAL_RULES_BLOCK}`, { mode: 0o644 });
  return 'inserted';
}

async function ensureGitignoreEntry(cwd: string): Promise<boolean> {
  const path = join(cwd, '.gitignore');
  const existing = await readTextIfExists(path);
  if (existing === null) {
    await writeFile(path, `${SESSIONS_IGNORE_ENTRY}\n`, { mode: 0o644 });
    return true;
  }

  const hasEntry = existing.split(/\r?\n/u).some((line) => line.trim() === SESSIONS_IGNORE_ENTRY);
  if (hasEntry) return false;

  const separator = existing.endsWith('\n') || existing.length === 0 ? '' : '\n';
  await writeFile(path, `${existing}${separator}${SESSIONS_IGNORE_ENTRY}\n`, { mode: 0o644 });
  return true;
}

export async function initializeJournalRules(cwd: string): Promise<InitJournalResult> {
  const agents = await readRulesFile(cwd, AGENTS_FILE);
  const claude = await readRulesFile(cwd, CLAUDE_FILE);
  const targetFiles = selectTargetFiles(agents, claude);
  const insertedFiles: RulesFileName[] = [];
  const alreadyInitializedFiles: RulesFileName[] = [];

  for (const file of targetFiles) {
    const result = await writeRulesBlock(cwd, file);
    if (result === 'inserted') insertedFiles.push(file);
    else alreadyInitializedFiles.push(file);
  }

  await mkdir(join(cwd, '.azri', 'sessions'), { recursive: true });
  const addedGitignoreEntry = await ensureGitignoreEntry(cwd);

  return {
    foundMessage: foundMessage(agents, claude),
    targetFiles,
    insertedFiles,
    alreadyInitializedFiles,
    createdSessionsDir: true,
    addedGitignoreEntry,
    newLineCount: JOURNAL_RULES_BLOCK.split('\n').length - 1,
  };
}

function printInitHelp(): void {
  console.log(
    [
      'azri init — initialize journal rules in AGENTS.md / CLAUDE.md',
      '',
      'USAGE',
      '  azri init',
      '',
      'Creates .azri/sessions/ and inserts Azri Journal rules into the project rules file.',
    ].join('\n'),
  );
}

function formatList(files: RulesFileName[]): string {
  return files.join(' and ');
}

export async function runInit(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    printInitHelp();
    return 0;
  }

  try {
    p.intro('azri · init');

    const result = await initializeJournalRules(process.cwd());
    p.log.info(result.foundMessage);

    for (const file of result.alreadyInitializedFiles) {
      p.log.info(`already initialized in ${file}`);
    }
    for (const file of result.insertedFiles) {
      p.log.info(`Wrote journal-rules block to ${file} (${result.newLineCount} new lines).`);
    }
    if (result.insertedFiles.length > 1) {
      p.log.info(`Inserted into both ${AGENTS_FILE} and ${CLAUDE_FILE}.`);
    }
    p.log.info('Created .azri/sessions/ directory.');
    p.log.info(
      result.addedGitignoreEntry
        ? 'Added .azri/sessions/ to .gitignore.'
        : '.azri/sessions/ already present in .gitignore.',
    );

    if (result.insertedFiles.length === 0) {
      p.outro('Already initialized.');
    } else {
      p.outro(
        [
          'Done. Your AI assistant will now keep a journal at',
          '   .azri/sessions/<branch>.md as it works on changes.',
          '   Run `azri pr <url>` after pushing to render with reasoning.',
        ].join('\n'),
      );
    }

    return 0;
  } catch (error) {
    p.cancel(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

export const testInternals = {
  JOURNAL_HEADER,
  JOURNAL_RULES_BLOCK,
  isPointerTo,
  selectTargetFiles,
  initializeJournalRules,
  formatList,
};
