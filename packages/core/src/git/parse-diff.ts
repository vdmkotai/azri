// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { ChangedFile, FileStatus } from '@azri/types';

import { isGenerated } from './file-filters.ts';

interface RawFileDiff {
  header: string;
  body: string;
}

function splitIntoFileDiffs(diff: string): RawFileDiff[] {
  if (!diff) return [];

  const normalized = diff.replace(/\r\n/gu, '\n');
  const parts = normalized.split(/^diff --git /mu);
  const files: RawFileDiff[] = [];

  for (const part of parts) {
    if (!part || !part.trim()) continue;
    const newlineIdx = part.indexOf('\n');
    const header = newlineIdx === -1 ? part : part.slice(0, newlineIdx);
    const body = newlineIdx === -1 ? '' : part.slice(newlineIdx + 1);
    files.push({ header, body });
  }

  return files;
}

function extractPath(header: string, body: string, status: FileStatus): string {
  if (status === 'renamed') {
    const renameTo = body.match(/^rename to (.+)$/mu);
    if (renameTo?.[1]) return renameTo[1].trim();
  }

  const tripleSlash = body.match(/^\+\+\+ b\/(.+)$/mu);
  if (tripleSlash?.[1] && tripleSlash[1] !== '/dev/null') return tripleSlash[1].trim();

  const tripleMinus = body.match(/^--- a\/(.+)$/mu);
  if (tripleMinus?.[1] && tripleMinus[1] !== '/dev/null') return tripleMinus[1].trim();

  const fromHeader = header.match(/^a\/(\S+) b\/(\S+)$/u);
  if (fromHeader?.[2]) return fromHeader[2];
  if (fromHeader?.[1]) return fromHeader[1];

  return header.trim();
}

function detectStatus(body: string): FileStatus {
  if (/^new file mode /mu.test(body)) return 'added';
  if (/^deleted file mode /mu.test(body)) return 'deleted';
  if (/^rename from /mu.test(body)) return 'renamed';
  return 'modified';
}

function detectBinary(body: string): boolean {
  if (/^Binary files .* differ$/mu.test(body)) return true;
  if (/^GIT binary patch$/mu.test(body)) return true;
  return false;
}

function countAdditionsDeletions(body: string): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;

  for (const line of body.split('\n')) {
    if (line.startsWith('+++ ') || line.startsWith('--- ')) continue;
    if (line.startsWith('+')) additions += 1;
    else if (line.startsWith('-')) deletions += 1;
  }

  return { additions, deletions };
}

function extractPatch(body: string): string {
  const lines = body.split('\n');
  const hunkStart = lines.findIndex((line) => line.startsWith('@@'));
  if (hunkStart === -1) return body.trim();
  return lines.slice(hunkStart).join('\n').trimEnd();
}

/**
 * Parse a unified `git diff` text into a list of changed files.
 * Handles additions, deletions, renames, and binary file markers.
 */
export function parseUnifiedDiff(diff: string): ChangedFile[] {
  const rawFiles = splitIntoFileDiffs(diff);
  const files: ChangedFile[] = [];

  for (const raw of rawFiles) {
    const status = detectStatus(raw.body);
    const path = extractPath(raw.header, raw.body, status);
    const isBinary = detectBinary(raw.body);
    const patch = isBinary ? '' : extractPatch(raw.body);
    const { additions, deletions } = isBinary
      ? { additions: 0, deletions: 0 }
      : countAdditionsDeletions(raw.body);

    files.push({
      path,
      status,
      patch,
      additions,
      deletions,
      isBinary,
      isGenerated: isGenerated(path),
    });
  }

  return files;
}
