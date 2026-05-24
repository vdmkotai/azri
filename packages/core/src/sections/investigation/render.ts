// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { InvestigationData, InvestigationHypothesis, InvestigationVerdict } from './schema.ts';

interface VerdictStyle {
  readonly pillClass: string;
  readonly badgeClass: string;
  readonly icon: string;
  readonly label: string;
}

const VERDICT_STYLE: Record<InvestigationVerdict, VerdictStyle> = {
  confirmed: {
    pillClass: 'bg-success/15 text-success ring-success/30',
    badgeClass: 'bg-success text-bg ring-success',
    icon: 'check-circle',
    label: 'Confirmed',
  },
  disproved: {
    pillClass: 'bg-danger/15 text-danger ring-danger/30',
    badgeClass: 'bg-danger text-bg ring-danger',
    icon: 'x-circle',
    label: 'Disproved',
  },
  inconclusive: {
    pillClass: 'bg-muted/30 text-muted-foreground ring-muted/50',
    badgeClass: 'bg-muted text-foreground ring-muted/60',
    icon: 'help-circle',
    label: 'Inconclusive',
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
  return slug || 'investigation';
}

function renderHypothesis(hypothesis: InvestigationHypothesis, isLast: boolean): string {
  const style = VERDICT_STYLE[hypothesis.verdict];
  const evidence = hypothesis.evidence
    ? `
        <div class="mt-3 rounded-md bg-muted/15 px-3 py-2 text-sm text-muted-foreground">
          <span class="font-semibold text-foreground/70">Evidence:</span> ${escapeHtml(hypothesis.evidence)}
        </div>`
    : '';
  const connector = isLast
    ? ''
    : `
      <div class="ml-5 h-6 w-px bg-muted/40" aria-hidden="true"></div>`;

  return `    <li class="relative">
      <div class="flex gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ring-2 ${style.badgeClass}">${hypothesis.number}</div>
        <div class="flex-1 rounded-card bg-surface p-4 ring-1 ring-muted/40 shadow-card">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-display text-lg font-semibold text-foreground">${escapeHtml(hypothesis.title)}</h3>
            <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style.pillClass}">
              <i data-lucide="${style.icon}" class="h-3.5 w-3.5"></i>
              ${style.label}
            </span>
          </div>
          <p class="text-sm leading-relaxed text-foreground/85">${escapeHtml(hypothesis.investigation)}</p>${evidence}
        </div>
      </div>${connector}
    </li>`;
}

export function renderSection(data: InvestigationData): string {
  const id = `investigation-${slugify(data.title)}`;
  const items = data.hypotheses
    .map((hypothesis, idx) => renderHypothesis(hypothesis, idx === data.hypotheses.length - 1))
    .join('\n');

  return `<section id="${id}" class="my-12">
  <div class="mb-6">
    <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Investigation</p>
    <h2 class="font-display text-2xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  </div>
  <ol class="space-y-0">
${items}
  </ol>
  <div class="mt-6 rounded-card border-l-4 border-primary bg-primary/5 p-5 ring-1 ring-primary/20">
    <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Conclusion</p>
    <p class="text-base leading-relaxed text-foreground">${escapeHtml(data.conclusion)}</p>
  </div>
</section>`;
}
