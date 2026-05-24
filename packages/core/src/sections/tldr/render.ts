// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { TldrData, TldrStat } from './schema.ts';

const STAT_COL_BY_COUNT: Record<number, string> = {
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

function renderStat(stat: TldrStat): string {
  const hint = stat.hint
    ? `<div class="mt-1 text-xs text-muted-foreground">${escapeHtml(stat.hint)}</div>`
    : '';
  return `      <div class="rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40">
        <div class="font-display text-2xl font-bold text-primary tabular-nums break-words leading-tight">${escapeHtml(stat.value)}</div>
        <div class="mt-1 text-sm font-medium text-foreground">${escapeHtml(stat.label)}</div>
        ${hint}
      </div>`;
}

export function renderSection(data: TldrData, _themeTokens: ThemeTokens): string {
  const lgCols = STAT_COL_BY_COUNT[data.stats.length] ?? 'lg:grid-cols-3';
  const stats = data.stats.map(renderStat).join('\n');
  return `<section id="tldr" class="mb-12">
  <div class="rounded-card bg-surface p-8 shadow-card ring-1 ring-muted/40">
    <p class="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary">TL;DR</p>
    <h2 class="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-4 leading-tight">${escapeHtml(data.hook)}</h2>
    <p class="text-base text-muted-foreground leading-relaxed md:text-lg">${escapeHtml(data.description)}</p>
  </div>
  <div class="mt-6 grid gap-4 grid-cols-2 md:grid-cols-3 ${lgCols}">
${stats}
  </div>
</section>`;
}
