// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { VerificationChecklistData, VerificationChecklistItem } from './schema.ts';

function renderItem(item: VerificationChecklistItem): string {
  const icon = item.verified ? 'check-circle' : 'circle';
  const iconColor = item.verified ? 'text-success' : 'text-muted-foreground';
  const textColor = item.verified ? 'text-foreground' : 'text-muted-foreground';
  const method =
    item.verified && item.method
      ? `\n        <p class="mt-1 text-xs text-muted-foreground leading-relaxed">${escapeHtml(item.method)}</p>`
      : '';
  return `    <li class="rounded-card bg-surface p-4 shadow-card ring-1 ring-muted/40 flex gap-3 items-start">
      <i data-lucide="${icon}" class="h-5 w-5 ${iconColor} shrink-0 mt-0.5" aria-hidden="true"></i>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium ${textColor} leading-relaxed">${escapeHtml(item.description)}</p>${method}
      </div>
    </li>`;
}

export function renderSection(data: VerificationChecklistData, _themeTokens: ThemeTokens): string {
  const items = data.items.map(renderItem).join('\n');
  return `<section id="verification-checklist" class="my-12">
  <h2 class="mb-6 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <ul class="space-y-3 list-none">
${items}
  </ul>
</section>`;
}
