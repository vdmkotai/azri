// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { RegressionRiskData, RegressionRiskEntry, RegressionRiskSeverity } from './schema.ts';

interface SeverityStyle {
  readonly container: string;
  readonly heading: string;
  readonly pill: string;
  readonly icon: string;
  readonly label: string;
  readonly mitigationLabel: string;
}

const SEVERITY_STYLE: Record<RegressionRiskSeverity, SeverityStyle> = {
  critical: {
    container: 'bg-danger/10 ring-2 ring-danger border-danger',
    heading: 'text-danger',
    pill: 'bg-danger text-bg ring-danger',
    icon: 'alert-octagon',
    label: 'Critical',
    mitigationLabel: 'text-danger',
  },
  high: {
    container: 'bg-warn/10 ring-1 ring-warn/60 border-warn',
    heading: 'text-warn',
    pill: 'bg-warn text-bg ring-warn',
    icon: 'alert-triangle',
    label: 'High',
    mitigationLabel: 'text-warn',
  },
  medium: {
    container: 'bg-primary/10 ring-1 ring-primary/40 border-primary',
    heading: 'text-primary',
    pill: 'bg-primary text-bg ring-primary',
    icon: 'alert-circle',
    label: 'Medium',
    mitigationLabel: 'text-primary',
  },
  low: {
    container: 'bg-muted/20 ring-1 ring-muted/40 border-muted-foreground/40',
    heading: 'text-muted-foreground',
    pill: 'bg-muted text-foreground ring-muted/50',
    icon: 'info',
    label: 'Low',
    mitigationLabel: 'text-muted-foreground',
  },
};

const SEVERITY_ORDER: Record<RegressionRiskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
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
  return slug || 'regression-risk';
}

function renderRisk(risk: RegressionRiskEntry): string {
  const style = SEVERITY_STYLE[risk.severity];
  const mitigation = risk.mitigation
    ? `
        <div class="mt-3 rounded-md bg-bg/40 px-3 py-2 ring-1 ring-muted/30">
          <p class="text-sm text-foreground">
            <span class="font-semibold ${style.mitigationLabel}">Mitigation:</span>
            ${escapeHtml(risk.mitigation)}
          </p>
        </div>`
    : '';
  return `    <li class="rounded-card border-l-4 ${style.container} p-5">
      <div class="flex gap-3">
        <i data-lucide="${style.icon}" class="h-5 w-5 ${style.heading} mt-0.5 shrink-0"></i>
        <div class="flex-1">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-display text-lg font-bold text-foreground">${escapeHtml(risk.area)}</h3>
            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ring-1 ${style.pill}">${style.label}</span>
          </div>
          <p class="text-sm leading-relaxed text-foreground/85">${escapeHtml(risk.description)}</p>${mitigation}
        </div>
      </div>
    </li>`;
}

export function renderSection(data: RegressionRiskData): string {
  const id = `regression-risk-${slugify(data.title)}`;
  const sorted = [...data.risks].toSorted(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
  const items = sorted.map((risk) => renderRisk(risk)).join('\n');

  return `<section id="${id}" class="my-12">
  <div class="mb-6 flex items-center gap-3">
    <i data-lucide="shield-alert" class="h-6 w-6 text-warn"></i>
    <h2 class="font-display text-2xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  </div>
  <ul class="space-y-4">
${items}
  </ul>
</section>`;
}
