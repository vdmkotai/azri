// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createHash } from 'node:crypto';

import type { LinkCalloutData, LinkCalloutKind } from './schema.ts';

const KIND_ICON: Record<LinkCalloutKind, string> = {
  docs: 'book-open',
  issue: 'circle-dot',
  pr: 'git-pull-request',
  article: 'newspaper',
  tool: 'wrench',
  repo: 'github',
};

const DEFAULT_ICON = 'link';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
}

function urlHash(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 10);
}

export function renderSection(data: LinkCalloutData): string {
  const id = `link-${urlHash(data.url)}`;
  const icon = data.kind ? KIND_ICON[data.kind] : DEFAULT_ICON;
  const safeUrl = escapeHtml(data.url);
  const kindBadge = data.kind
    ? `<span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium uppercase tracking-wider">${escapeHtml(data.kind)}</span>`
    : '';

  return `<section id="${id}" class="my-8">
  <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="block rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40 hover:ring-primary/50 hover:shadow-lg transition group">
    <div class="flex items-start gap-4">
      <div class="rounded-md bg-primary/10 p-3 shrink-0">
        <i data-lucide="${icon}" class="h-5 w-5 text-primary"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2 mb-1">
          ${kindBadge}<span class="font-display text-lg font-semibold text-foreground group-hover:text-primary truncate">${escapeHtml(data.title)}</span>
          <i data-lucide="external-link" class="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0"></i>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">${escapeHtml(data.description)}</p>
        <p class="mt-2 text-xs font-mono text-muted-foreground truncate">${safeUrl}</p>
      </div>
    </div>
  </a>
</section>`;
}
