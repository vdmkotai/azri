// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { ReviewerGuideData, ReviewerGuidePriority } from './schema.ts';

function rankBadge(rank: number): string {
  if (rank === 1) {
    return `<div class="shrink-0 w-14 h-14 rounded-full bg-primary text-bg font-display font-bold text-2xl flex items-center justify-center shadow-card" aria-hidden="true">${rank}</div>`;
  }
  if (rank <= 3) {
    return `<div class="shrink-0 w-10 h-10 rounded-full bg-primary/15 text-primary font-display font-bold text-lg flex items-center justify-center" aria-hidden="true">${rank}</div>`;
  }
  return `<div class="shrink-0 w-10 h-10 rounded-full bg-muted/40 text-muted-foreground font-display font-bold text-lg flex items-center justify-center" aria-hidden="true">${rank}</div>`;
}

function renderFiles(files: readonly string[]): string {
  const chips = files
    .map(
      (file) =>
        `        <code class="font-mono text-xs px-2 py-1 rounded bg-muted/30 text-foreground break-all">${escapeHtml(file)}</code>`,
    )
    .join('\n');
  return `      <div class="flex flex-wrap gap-2 mt-3">
${chips}
      </div>`;
}

function renderPriority(priority: ReviewerGuidePriority): string {
  return `    <li class="rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40 flex gap-4 items-start">
      ${rankBadge(priority.rank)}
      <div class="flex-1 min-w-0">
        <h3 class="font-display text-lg font-bold text-foreground mb-1">${escapeHtml(priority.area)}</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">${escapeHtml(priority.what_to_check)}</p>
${renderFiles(priority.files)}
      </div>
    </li>`;
}

export function renderSection(data: ReviewerGuideData, _themeTokens: ThemeTokens): string {
  const sorted = [...data.priorities].toSorted((a, b) => a.rank - b.rank);
  const items = sorted.map((priority) => renderPriority(priority)).join('\n');
  return `<section id="reviewer-guide" class="my-12">
  <h2 class="mb-6 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <ol class="space-y-4 list-none">
${items}
  </ol>
</section>`;
}
