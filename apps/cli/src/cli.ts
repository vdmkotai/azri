// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

process.on('SIGINT', () => {
  process.stdout.write('\u001B[?25h\u001B[0m\n');
  process.exit(130);
});

import pkg from '../package.json' with { type: 'json' };
import { runAuth } from './commands/auth.ts';
import { runDiff } from './commands/diff.ts';
import { runDoctor } from './commands/doctor.ts';
import { runInit } from './commands/init.ts';
import { runPr } from './commands/pr.ts';
import { runReport } from './commands/report.ts';
import { runSetup } from './commands/setup.ts';
import { runTheme } from './commands/theme.ts';
import { printHelp } from './help.ts';

const VERSION = pkg.version;

const KNOWN_COMMANDS = [
  'report',
  'pr',
  'diff',
  'auth',
  'doctor',
  'init',
  'setup',
  'theme',
] as const;
type KnownCommand = (typeof KNOWN_COMMANDS)[number];

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  );
  for (let i = 0; i <= a.length; i++) dp[i]![0] = i;
  for (let j = 0; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[a.length]![b.length]!;
}

function suggest(input: string): string | null {
  let best: { cmd: KnownCommand; dist: number } | null = null;
  for (const cmd of KNOWN_COMMANDS) {
    const d = levenshtein(input, cmd);
    if (d < 3 && (!best || d < best.dist)) best = { cmd, dist: d };
  }
  return best?.cmd ?? null;
}

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);

  if (args.length === 0) {
    printHelp(VERSION);
    return 0;
  }

  if (args[0] === '--help' || args[0] === '-h') {
    printHelp(VERSION);
    return 0;
  }
  if (args.includes('--version') || args.includes('-V')) {
    console.log(VERSION);
    return 0;
  }

  const [command, ...rest] = args;
  if (!command) {
    printHelp(VERSION);
    return 0;
  }

  switch (command) {
    case 'report':
      return await runReport(rest);
    case 'pr':
      return await runPr(rest);
    case 'diff':
      return await runDiff(rest);
    case 'auth':
      return await runAuth(rest);
    case 'doctor':
      return await runDoctor();
    case 'init':
      return await runInit(rest);
    case 'setup':
      return await runSetup(rest);
    case 'theme':
      return await runTheme(rest);
    default: {
      const hint = suggest(command);
      console.error(`azri: unknown command '${command}'`);
      if (hint) console.error(`Did you mean 'azri ${hint}'?`);
      console.error(`Run 'azri --help' for usage.`);
      return 1;
    }
  }
}

const exitCode = await main(process.argv);
process.exit(exitCode);
