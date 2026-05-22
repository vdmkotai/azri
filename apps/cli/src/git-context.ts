// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { $ } from 'bun';

export interface GitContext {
  owner: string;
  repo: string;
  branch: string;
}

/**
 * Detect owner/repo from cwd's git remote 'origin'.
 * Returns null if not in a git repo or no origin remote.
 */
export async function detectGitContext(cwd: string = process.cwd()): Promise<GitContext | null> {
  try {
    const remote = (await $`git -C ${cwd} remote get-url origin`.quiet().text()).trim();
    const match =
      remote.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/iu) ||
      remote.match(/^https:\/\/github\.com\/([^/]+)\/([^/.]+)(?:\.git)?$/iu);
    if (!match) return null;
    const branch = (await $`git -C ${cwd} rev-parse --abbrev-ref HEAD`.quiet().text()).trim();
    return { owner: match[1]!, repo: match[2]!, branch };
  } catch {
    return null;
  }
}
