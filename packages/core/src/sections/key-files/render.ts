// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { KeyFileEntry, KeyFileImportance, KeyFilesData } from './schema.ts';

interface ImportanceStyle {
  readonly pill: string;
  readonly label: string;
}

const IMPORTANCE_STYLE: Record<KeyFileImportance, ImportanceStyle> = {
  entry: { pill: 'bg-primary/10 text-primary', label: 'Entry' },
  critical: { pill: 'bg-danger/10 text-danger', label: 'Critical' },
  reference: { pill: 'bg-muted/30 text-muted-foreground', label: 'Reference' },
};

function renderRank(rank: number): string {
  return `<div class="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-display font-bold text-lg flex items-center justify-center" aria-hidden="true">${rank}</div>`;
}

function renderFile(entry: KeyFileEntry, rank: number): string {
  const style = IMPORTANCE_STYLE[entry.importance];
  return `    <li class="rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40 flex gap-4 items-start">
      ${renderRank(rank)}
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-baseline gap-3 mb-2">
          <code class="font-mono text-sm text-foreground break-all">${escapeHtml(entry.path)}</code>
          <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${style.pill}">${style.label}</span>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">${escapeHtml(entry.why_first)}</p>
      </div>
    </li>`;
}

export function renderSection(data: KeyFilesData, _themeTokens: ThemeTokens): string {
  const items = data.files.map((file, index) => renderFile(file, index + 1)).join('\n');
  return `<section id="key-files" class="my-12">
  <h2 class="mb-6 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <ol class="space-y-4 list-none">
${items}
  </ol>
</section>`;
}
