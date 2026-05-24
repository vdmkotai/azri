// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { PrTldrData, PrTldrImpact, PrTldrStats } from './schema.ts';

interface ImpactStyle {
  readonly pill: string;
  readonly label: string;
}

const IMPACT_STYLE: Record<PrTldrImpact, ImpactStyle> = {
  major: { pill: 'bg-danger/10 text-danger ring-danger/30', label: 'Major' },
  minor: { pill: 'bg-warn/10 text-warn ring-warn/30', label: 'Minor' },
  patch: { pill: 'bg-primary/10 text-primary ring-primary/30', label: 'Patch' },
  internal: {
    pill: 'bg-muted/30 text-muted-foreground ring-muted/50',
    label: 'Internal',
  },
};

function formatInt(value: number): string {
  return value.toLocaleString('en-US');
}

function renderStat(label: string, value: string, accent: string): string {
  return `      <div class="rounded-md bg-bg p-4 ring-1 ring-muted/40">
        <div class="font-mono text-2xl font-bold ${accent}">${escapeHtml(value)}</div>
        <div class="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">${escapeHtml(label)}</div>
      </div>`;
}

function renderStats(stats: PrTldrStats): string {
  return `  <div class="mt-6 grid grid-cols-3 gap-3">
${renderStat('files', formatInt(stats.filesChanged), 'text-foreground')}
${renderStat('+ added', `+${formatInt(stats.additions)}`, 'text-success')}
${renderStat('− removed', `−${formatInt(stats.deletions)}`, 'text-danger')}
  </div>`;
}

export function renderSection(data: PrTldrData, _themeTokens: ThemeTokens): string {
  const style = IMPACT_STYLE[data.impact];
  const stats = data.stats ? `\n${renderStats(data.stats)}` : '';

  return `<section id="pr-tldr" class="mb-12">
  <div class="rounded-card bg-surface p-8 shadow-card ring-1 ring-muted/40">
    <div class="mb-3 flex items-center gap-3">
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-primary">PR TL;DR</p>
      <span class="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 ${style.pill}">${style.label}</span>
    </div>
    <h2 class="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">${escapeHtml(data.what)}</h2>
    <p class="text-lg text-muted-foreground leading-relaxed">${escapeHtml(data.why)}</p>${stats}
  </div>
</section>`;
}
