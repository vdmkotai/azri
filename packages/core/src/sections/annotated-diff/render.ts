// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { AnnotatedDiffData, AnnotatedDiffHunk } from './schema.ts';

function slugifyPath(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[/.]/gu, '-')
    .replace(/[^\w-]/gu, '')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '')
    .slice(0, 80);
  return slug || fallback;
}

function classifyDiffLine(line: string): string {
  if (line.startsWith('+')) return 'text-success';
  if (line.startsWith('-')) return 'text-danger';
  return 'text-zinc-400';
}

function renderDiffCode(code: string): string {
  const lines = code.split('\n');
  return lines
    .map((line) => {
      const cls = classifyDiffLine(line);
      return `<span class="block ${cls}">${escapeHtml(line === '' ? ' ' : line)}</span>`;
    })
    .join('');
}

function renderHunk(hunk: AnnotatedDiffHunk, index: number): string {
  const hunkId = `annotated-diff-${index}-${slugifyPath(hunk.filePath, `hunk-${index}`)}`;
  return `  <article id="${escapeHtml(hunkId)}" class="space-y-3">
    <header class="flex flex-wrap items-baseline gap-3">
      <code class="text-xs font-mono text-foreground break-all">${escapeHtml(hunk.filePath)}</code>
      <span class="text-xs font-mono text-muted-foreground">L${escapeHtml(hunk.lineRange)}</span>
      <span class="text-xs font-mono uppercase tracking-wider text-muted-foreground">${escapeHtml(hunk.language)}</span>
    </header>
    <pre class="bg-zinc-900 text-zinc-100 p-5 rounded-card overflow-x-auto shadow-card ring-1 ring-muted/40"><code class="font-mono text-sm leading-relaxed language-${escapeHtml(hunk.language)}">${renderDiffCode(hunk.code)}</code></pre>
    <div class="bg-surface p-4 rounded-md border-l-4 border-primary shadow-sm ring-1 ring-muted/40">
      <p class="text-sm text-foreground leading-relaxed">${escapeHtml(hunk.annotation)}</p>
    </div>
  </article>`;
}

export function renderSection(data: AnnotatedDiffData, _themeTokens: ThemeTokens): string {
  const hunks = data.hunks.map((hunk, index) => renderHunk(hunk, index)).join('\n');
  return `<section id="annotated-diff" class="my-12">
  <h2 class="mb-6 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <div class="space-y-8">
${hunks}
  </div>
</section>`;
}
