// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { ArchitectureDecisionData } from './schema.ts';

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

function slugify(value: string): string {
  const cleaned = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/gu, '')
    .trim()
    .replace(/[\s_]+/gu, '-')
    .replace(/-+/gu, '-')
    .slice(0, 60);
  return cleaned || 'decision';
}

function renderAlternatives(data: ArchitectureDecisionData): string {
  return data.alternatives
    .map(
      (alt) => `          <li class="flex gap-3 text-sm">
            <span class="shrink-0 font-mono text-muted-foreground">×</span>
            <div>
              <span class="font-semibold text-foreground">${escapeHtml(alt.option)}</span>
              <span class="text-muted-foreground"> — ${escapeHtml(alt.why_not)}</span>
            </div>
          </li>`,
    )
    .join('\n');
}

function renderTradeoffs(data: ArchitectureDecisionData): string {
  if (!data.tradeoffs) return '';
  return `
        <div class="grid gap-4 border-t border-muted/40 pt-4 md:grid-cols-2">
          <div class="rounded-md border-l-4 border-success bg-success/10 p-4">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-success">Gain</p>
            <p class="text-sm text-foreground">${escapeHtml(data.tradeoffs.gain)}</p>
          </div>
          <div class="rounded-md border-l-4 border-warn bg-warn/10 p-4">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-warn">Cost</p>
            <p class="text-sm text-foreground">${escapeHtml(data.tradeoffs.cost)}</p>
          </div>
        </div>`;
}

function renderCitations(data: ArchitectureDecisionData): string {
  if (!data.citations || data.citations.length === 0) return '';
  const items = data.citations
    .map((citation) => `            <li>${escapeHtml(citation)}</li>`)
    .join('\n');
  return `
        <div class="border-t border-muted/40 pt-4">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">References</p>
          <ul class="space-y-1 font-mono text-xs text-muted-foreground">
${items}
          </ul>
        </div>`;
}

export function renderSection(data: ArchitectureDecisionData): string {
  const id = `decision-${slugify(data.title)}`;
  return `<section id="${escapeHtml(id)}" class="my-12">
  <div class="overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-muted/40">
    <div class="border-b border-muted/40 bg-linear-to-r from-primary/20 to-primary/5 p-5">
      <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Architecture Decision</p>
      <h2 class="font-display text-2xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
    </div>
    <div class="space-y-5 p-6">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">Decision</p>
        <p class="text-lg font-medium text-foreground">${escapeHtml(data.decision)}</p>
      </div>
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">Why</p>
        <p class="text-base leading-relaxed text-foreground">${escapeHtml(data.why)}</p>
      </div>
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">Alternatives considered</p>
        <ul class="space-y-2">
${renderAlternatives(data)}
        </ul>
      </div>${renderTradeoffs(data)}${renderCitations(data)}
    </div>
  </div>
</section>`;
}
