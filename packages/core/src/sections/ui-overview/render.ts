// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { UiOverviewData, UiRegion } from './schema.ts';

function renderRegion(region: UiRegion): string {
  return `    <div class="rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40">
      <div class="mb-2 flex items-center gap-2">
        <i data-lucide="layout-panel-top" class="h-4 w-4 text-primary shrink-0" aria-hidden="true"></i>
        <h3 class="font-display text-lg font-semibold text-foreground">${escapeHtml(region.name)}</h3>
      </div>
      <p class="mb-3 text-sm font-medium text-primary">${escapeHtml(region.role)}</p>
      <p class="text-sm leading-relaxed text-muted-foreground">${escapeHtml(region.contents)}</p>
    </div>`;
}

function renderMockup(mockup: string | undefined): string {
  if (!mockup) return '';
  return `
  <figure class="mt-6 overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-muted/40">
    <figcaption class="border-b border-muted/40 bg-muted/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layout mockup</figcaption>
    <pre class="overflow-x-auto p-5 font-mono text-xs leading-snug text-foreground"><code>${escapeHtml(mockup)}</code></pre>
  </figure>`;
}

export function renderSection(data: UiOverviewData, _themeTokens: ThemeTokens): string {
  const regions = data.regions.map(renderRegion).join('\n');
  return `<section id="ui-overview" class="my-12">
  <div class="mb-8">
    <p class="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-primary">UI overview</p>
    <h2 class="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">${escapeHtml(data.title)}</h2>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
${regions}
  </div>${renderMockup(data.mockupAscii)}
</section>`;
}
