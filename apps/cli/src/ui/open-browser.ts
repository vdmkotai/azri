// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { spawn } from 'node:child_process';

export interface OpenOptions {
  dryRun?: boolean;
}

function commandFor(
  platform: NodeJS.Platform,
): { cmd: string; args: ReadonlyArray<string> } | null {
  switch (platform) {
    case 'darwin':
      return { cmd: 'open', args: [] };
    case 'linux':
      return { cmd: 'xdg-open', args: [] };
    case 'win32':
      return { cmd: 'cmd', args: ['/c', 'start', '""'] };
    default:
      return null;
  }
}

export async function openInBrowser(url: string, opts: OpenOptions = {}): Promise<void> {
  if (opts.dryRun) return;
  if (process.env.CI) return;

  const command = commandFor(process.platform);
  if (!command) return;

  await new Promise<void>((resolve) => {
    const child = spawn(command.cmd, [...command.args, url], { stdio: 'ignore', detached: true });
    child.unref();
    child.once('error', () => resolve());
    child.once('spawn', () => resolve());
    setTimeout(() => resolve(), 500);
  });
}
