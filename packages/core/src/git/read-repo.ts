// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { $ } from 'bun';

import type { FileEntry, RepoSnapshot } from '@azri/types';

import { getDefaultBranch } from './default-branch.ts';

const README_CANDIDATES = [
  'README.md',
  'README.MD',
  'readme.md',
  'README',
  'README.rst',
  'README.txt',
];

const MANIFEST_CANDIDATES = [
  'package.json',
  'Cargo.toml',
  'go.mod',
  'pyproject.toml',
  'Gemfile',
  'composer.json',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
];

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.py': 'Python',
  '.rb': 'Ruby',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.c': 'C',
  '.h': 'C',
  '.cc': 'C++',
  '.cpp': 'C++',
  '.cs': 'C#',
  '.php': 'PHP',
  '.scala': 'Scala',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
  '.erl': 'Erlang',
  '.hs': 'Haskell',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.lua': 'Lua',
  '.r': 'R',
  '.dart': 'Dart',
  '.md': 'Markdown',
  '.yml': 'YAML',
  '.yaml': 'YAML',
  '.toml': 'TOML',
  '.json': 'JSON',
  '.sql': 'SQL',
};

function safeJoin(repoPath: string, relativePath: string): string | null {
  if (relativePath.includes('..')) return null;
  if (relativePath.startsWith('/')) return null;
  return join(repoPath, relativePath);
}

async function listTrackedFiles(repoPath: string): Promise<string[]> {
  const out = await $`git -C ${repoPath} ls-files -z`.quiet().text();
  return out.split('\0').filter((s) => s.length > 0);
}

async function readRecentCommitCounts(repoPath: string): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  try {
    const out = await $`git -C ${repoPath} log --since=90.days --name-only --pretty=format:`
      .quiet()
      .text();
    for (const line of out.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    }
  } catch {
    // Ignore — fallback to empty map when git log fails (shallow clone, no history, etc.).
  }
  return counts;
}

async function readLastModified(repoPath: string, paths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) return result;

  try {
    for (const path of paths) {
      const out = await $`git -C ${repoPath} log -1 --format=%cI -- ${path}`.quiet().text();
      const trimmed = out.trim();
      if (trimmed) result.set(path, trimmed);
    }
  } catch {
    // Ignore — best effort.
  }

  return result;
}

async function readReadme(repoPath: string): Promise<string | null> {
  for (const candidate of README_CANDIDATES) {
    const full = safeJoin(repoPath, candidate);
    if (!full) continue;
    try {
      return await readFile(full, 'utf8');
    } catch {
      continue;
    }
  }
  return null;
}

async function readManifests(repoPath: string): Promise<Record<string, string>> {
  const manifests: Record<string, string> = {};
  for (const candidate of MANIFEST_CANDIDATES) {
    const full = safeJoin(repoPath, candidate);
    if (!full) continue;
    try {
      const text = await readFile(full, 'utf8');
      manifests[candidate] = text;
    } catch {
      continue;
    }
  }
  return manifests;
}

async function readRemoteOwnerName(repoPath: string): Promise<{ owner: string; name: string }> {
  try {
    const out = await $`git -C ${repoPath} config --get remote.origin.url`.quiet().text();
    const url = out.trim();
    const match = url.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/u) ?? url.match(/^([^/]+)\/(.+?)$/u);
    if (match?.[1] && match?.[2]) {
      return { owner: match[1], name: match[2].replace(/\.git$/u, '') };
    }
  } catch {
    // Ignore — fall through to directory-based default.
  }

  const segments = repoPath.split('/').filter(Boolean);
  const name = segments.at(-1) ?? 'unknown';
  return { owner: 'local', name };
}

async function countFileLines(absPath: string): Promise<number> {
  try {
    const text = await readFile(absPath, 'utf8');
    if (text.length === 0) return 0;
    const trailing = text.endsWith('\n') ? 0 : 1;
    return text.split('\n').length - 1 + trailing;
  } catch {
    return 0;
  }
}

function detectLanguage(path: string): string | null {
  const ext = extname(path).toLowerCase();
  return LANGUAGE_BY_EXTENSION[ext] ?? null;
}

/**
 * Capture a `RepoSnapshot` from a local git repository checkout.
 * Reads git metadata, README, package manifests, and per-file stats.
 */
export async function readRepoSnapshot(repoPath: string): Promise<RepoSnapshot> {
  const tracked = await listTrackedFiles(repoPath);
  const recentCommitCounts = await readRecentCommitCounts(repoPath);

  const fileTree: FileEntry[] = [];
  const languages: Record<string, number> = {};

  for (const relPath of tracked) {
    const absPath = safeJoin(repoPath, relPath);
    if (!absPath) continue;

    let sizeBytes = 0;
    try {
      const stats = await stat(absPath);
      sizeBytes = stats.size;
    } catch {
      continue;
    }

    const lineCount = await countFileLines(absPath);
    const language = detectLanguage(relPath);
    if (language) {
      languages[language] = (languages[language] ?? 0) + sizeBytes;
    }

    const entry: FileEntry = {
      path: relPath,
      sizeBytes,
      lineCount,
    };

    const commitCount = recentCommitCounts.get(relPath);
    if (commitCount !== undefined) entry.lastModifiedCommitsCount = commitCount;

    fileTree.push(entry);
  }

  const samplePaths = fileTree.slice(0, 50).map((f) => f.path);
  const lastModified = await readLastModified(repoPath, samplePaths);
  for (const entry of fileTree) {
    const ts = lastModified.get(entry.path);
    if (ts) entry.lastModifiedAt = ts;
  }

  const { owner, name } = await readRemoteOwnerName(repoPath);
  const defaultBranch = (await getDefaultBranch({ owner, repo: name, repoPath })) ?? '';
  const readme = await readReadme(repoPath);
  const packageManifests = await readManifests(repoPath);

  return {
    owner,
    name,
    defaultBranch,
    readme,
    languages,
    packageManifests,
    fileTree,
    capturedAt: new Date().toISOString(),
  };
}
