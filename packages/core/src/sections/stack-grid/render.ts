// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { StackGridData, StackItem } from './schema.ts';

const ICON_COLOR_HEX = '3b82f6';

function renderItem(item: StackItem): string {
  const safeSlug = encodeURIComponent(item.slug);
  return `    <div class="rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40 hover:shadow-lg transition">
      <div class="flex items-center gap-3 mb-3">
        <img src="https://cdn.simpleicons.org/${safeSlug}/${ICON_COLOR_HEX}" width="32" height="32" alt="${escapeHtml(item.name)}" class="rounded" loading="lazy">
        <div class="font-display text-xl font-semibold text-foreground">${escapeHtml(item.name)}</div>
      </div>
      <p class="text-sm text-muted-foreground mb-3">${escapeHtml(item.role)}</p>
      <span class="inline-block text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">${escapeHtml(item.category)}</span>
    </div>`;
}

export function renderSection(data: StackGridData, _themeTokens: ThemeTokens): string {
  const items = data.items.map(renderItem).join('\n');
  return `<section id="stack-grid" class="my-12">
  <h2 class="font-display text-3xl font-bold text-foreground mb-6">${escapeHtml(data.title)}</h2>
  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
${items}
  </div>
</section>`;
}
