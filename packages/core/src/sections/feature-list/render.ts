// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { Feature, FeatureListData, FeatureStatus } from './schema.ts';

interface StatusClasses {
  readonly pill: string;
  readonly label: string;
}

const STATUS_CLASSES: Record<FeatureStatus, StatusClasses> = {
  shipped: {
    pill: 'bg-success/15 text-success ring-success/30',
    label: 'Shipped',
  },
  beta: {
    pill: 'bg-warn/15 text-warn ring-warn/30',
    label: 'Beta',
  },
  planned: {
    pill: 'bg-muted/30 text-muted-foreground ring-muted/40',
    label: 'Planned',
  },
};

function renderFeature(feature: Feature): string {
  const status = STATUS_CLASSES[feature.status];
  return `    <div class="flex h-full flex-col rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40 transition hover:shadow-lg">
      <div class="mb-3 flex items-start justify-between gap-3">
        <div class="rounded-md bg-primary/10 p-2.5">
          <i data-lucide="${escapeHtml(feature.icon)}" class="h-5 w-5 text-primary" aria-hidden="true"></i>
        </div>
        <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ring-1 ${status.pill}">${status.label}</span>
      </div>
      <h3 class="font-display text-lg font-semibold text-foreground">${escapeHtml(feature.name)}</h3>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">${escapeHtml(feature.description)}</p>
    </div>`;
}

export function renderSection(data: FeatureListData, _themeTokens: ThemeTokens): string {
  const features = data.features.map(renderFeature).join('\n');
  return `<section id="feature-list" class="my-12">
  <div class="mb-8">
    <p class="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-primary">Features</p>
    <h2 class="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">${escapeHtml(data.title)}</h2>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
${features}
  </div>
</section>`;
}
