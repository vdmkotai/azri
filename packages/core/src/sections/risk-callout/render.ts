// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { RiskCalloutData, RiskCalloutSeverity } from './schema.ts';

interface SeverityStyle {
  readonly container: string;
  readonly heading: string;
  readonly suggestionLabel: string;
  readonly iconWrapper: string;
  readonly icon: string;
}

const SEVERITY_STYLE: Record<RiskCalloutSeverity, SeverityStyle> = {
  info: {
    container: 'bg-primary/5 ring-primary/30 border-primary',
    heading: 'text-primary',
    suggestionLabel: 'text-primary',
    iconWrapper: 'text-primary',
    icon: 'info',
  },
  warn: {
    container: 'bg-warn/5 ring-warn/30 border-warn',
    heading: 'text-warn',
    suggestionLabel: 'text-warn',
    iconWrapper: 'text-warn',
    icon: 'alert-triangle',
  },
  danger: {
    container: 'bg-danger/5 ring-danger/30 border-danger',
    heading: 'text-danger',
    suggestionLabel: 'text-danger',
    iconWrapper: 'text-danger',
    icon: 'alert-octagon',
  },
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 64);
  return slug || 'section';
}

export function renderSection(data: RiskCalloutData): string {
  const style = SEVERITY_STYLE[data.severity];
  const id = `risk-${slugify(data.title)}`;
  const suggestion = data.suggestion
    ? `
          <p class="mt-3 text-sm text-foreground">
            <span class="font-semibold ${style.suggestionLabel}">Suggestion:</span> ${escapeHtml(data.suggestion)}
          </p>`
    : '';

  return `<section id="${id}" class="my-8">
  <div class="rounded-card ${style.container} p-5 ring-1 border-l-4">
    <div class="flex gap-3">
      <i data-lucide="${style.icon}" class="h-5 w-5 ${style.iconWrapper} mt-0.5 shrink-0"></i>
      <div class="flex-1">
        <h3 class="font-display font-bold ${style.heading} mb-1">${escapeHtml(data.title)}</h3>
        <p class="text-sm text-foreground leading-relaxed">${escapeHtml(data.body)}</p>${suggestion}
      </div>
    </div>
  </div>
</section>`;
}
