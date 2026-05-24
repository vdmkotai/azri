// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { DirectoryEntry, DirectoryTreeData } from './schema.ts';

interface PreparedRow {
  readonly depth: number;
  readonly displayName: string;
  readonly description: string;
  readonly icon: 'folder' | 'file-text';
  readonly key: string;
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/u, '').replace(/\/+/gu, '/');
}

function depthOf(path: string): number {
  const normalized = normalizePath(path).replace(/\/$/u, '');
  if (!normalized) return 0;
  return normalized.split('/').length - 1;
}

function nameOf(path: string, kind: 'dir' | 'file'): string {
  const normalized = normalizePath(path).replace(/\/$/u, '');
  const segments = normalized.split('/');
  const last = segments.at(-1) ?? normalized;
  return kind === 'dir' ? `${last}/` : last;
}

function prepareRows(entries: readonly DirectoryEntry[]): PreparedRow[] {
  return entries
    .map((entry, index) => ({
      depth: depthOf(entry.path),
      displayName: nameOf(entry.path, entry.kind),
      description: entry.description,
      icon: entry.kind === 'dir' ? ('folder' as const) : ('file-text' as const),
      key: `${entry.path}-${index}`,
    }))
    .toSorted((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.displayName.localeCompare(b.displayName);
    });
}

function pathPrefix(depth: number, isLast: boolean): string {
  if (depth === 0) return '';
  const indent = '│  '.repeat(Math.max(depth - 1, 0));
  const connector = isLast ? '└─ ' : '├─ ';
  return `${indent}${connector}`;
}

function renderRow(row: PreparedRow, isLast: boolean): string {
  const prefix = pathPrefix(row.depth, isLast);
  const safePrefix = escapeHtml(prefix);
  const iconClass = row.icon === 'folder' ? 'text-primary' : 'text-muted-foreground';
  return `<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 py-1 border-b border-muted/20 last:border-b-0">
    <div class="font-mono text-sm text-foreground whitespace-pre flex items-center gap-2 min-w-0">
      <span class="text-muted-foreground/70">${safePrefix}</span>
      <i data-lucide="${row.icon}" class="w-4 h-4 ${iconClass} shrink-0"></i>
      <span class="truncate">${escapeHtml(row.displayName)}</span>
    </div>
    <div class="text-sm text-muted-foreground leading-relaxed">${escapeHtml(row.description)}</div>
  </div>`;
}

function isLastAtDepth(rows: readonly PreparedRow[], index: number): boolean {
  const current = rows[index];
  if (!current) return true;
  for (let next = index + 1; next < rows.length; next += 1) {
    const sibling = rows[next];
    if (!sibling) continue;
    if (sibling.depth < current.depth) return true;
    if (sibling.depth === current.depth) return false;
  }
  return true;
}

export function renderSection(data: DirectoryTreeData, _themeTokens: ThemeTokens): string {
  const rows = prepareRows(data.entries);
  const body = rows
    .map((row, index) => `    ${renderRow(row, isLastAtDepth(rows, index))}`)
    .join('\n');
  const rootRow = `<div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 py-1 border-b border-muted/20">
    <div class="font-mono text-sm font-bold text-foreground flex items-center gap-2 min-w-0">
      <i data-lucide="folder" class="w-4 h-4 text-primary shrink-0"></i>
      <span class="truncate">${escapeHtml(data.root)}/</span>
    </div>
    <div class="text-sm text-muted-foreground italic">repository root</div>
  </div>`;

  return `<section id="directory-tree" class="my-12">
  <h2 class="mb-4 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <div class="rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40 overflow-x-auto">
    ${rootRow}
${body}
  </div>
</section>`;
}
