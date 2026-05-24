// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type {
  WhatsNextCommit,
  WhatsNextData,
  WhatsNextOpenPr,
  WhatsNextPlannedWork,
} from './schema.ts';

function renderCommit(commit: WhatsNextCommit): string {
  const shortSha = commit.sha.slice(0, 7);
  const metaParts: string[] = [];
  if (commit.author) metaParts.push(escapeHtml(commit.author));
  if (commit.date) metaParts.push(escapeHtml(commit.date));
  const meta = metaParts.join(' · ');
  const metaLine = meta ? `<div class="mt-1 text-xs text-muted-foreground">${meta}</div>` : '';
  return `        <li class="relative pl-8">
          <span class="absolute left-0 top-1 inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary ring-4 ring-bg">
            <i data-lucide="git-commit" class="h-3.5 w-3.5"></i>
          </span>
          <div class="flex items-baseline gap-2 flex-wrap">
            <code class="text-xs font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">${escapeHtml(shortSha)}</code>
            <span class="text-sm text-foreground leading-snug">${escapeHtml(commit.message)}</span>
          </div>
          ${metaLine}
        </li>`;
}

function renderOpenPr(pr: WhatsNextOpenPr): string {
  return `      <div class="rounded-card bg-surface p-4 shadow-card ring-1 ring-muted/40">
        <div class="flex items-center gap-2 mb-2">
          <i data-lucide="git-pull-request" class="h-4 w-4 text-success shrink-0"></i>
          <span class="text-xs font-mono text-muted-foreground">#${pr.number}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium uppercase tracking-wider">${escapeHtml(pr.status)}</span>
        </div>
        <p class="text-sm text-foreground leading-relaxed">${escapeHtml(pr.title)}</p>
      </div>`;
}

function renderPlanned(plan: WhatsNextPlannedWork): string {
  return `      <div class="rounded-card bg-surface p-4 shadow-card ring-1 ring-muted/40">
        <div class="flex items-center gap-2 mb-2">
          <i data-lucide="target" class="h-4 w-4 text-primary shrink-0"></i>
          <code class="text-xs font-mono text-muted-foreground truncate">${escapeHtml(plan.source)}</code>
        </div>
        <p class="text-sm text-foreground leading-relaxed">${escapeHtml(plan.title)}</p>
      </div>`;
}

function renderCommitsColumn(commits: readonly WhatsNextCommit[]): string {
  if (commits.length === 0) return '';
  const items = commits.map((commit) => renderCommit(commit)).join('\n');
  return `    <div>
      <h3 class="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">Recent commits</h3>
      <ol class="relative space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-px before:bg-muted/40">
${items}
      </ol>
    </div>`;
}

function renderColumn(label: string, cards: readonly string[]): string {
  if (cards.length === 0) return '';
  return `    <div>
      <h3 class="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">${escapeHtml(label)}</h3>
      <div class="space-y-3">
${cards.join('\n')}
      </div>
    </div>`;
}

export function renderSection(data: WhatsNextData, _themeTokens: ThemeTokens): string {
  const openPrs = data.openPRs ?? [];
  const planned = data.plannedWork ?? [];

  if (data.recentCommits.length === 0 && openPrs.length === 0 && planned.length === 0) {
    return '';
  }

  const columns = [
    renderCommitsColumn(data.recentCommits),
    renderColumn(
      'Open PRs',
      openPrs.map((pr) => renderOpenPr(pr)),
    ),
    renderColumn(
      'Planned work',
      planned.map((plan) => renderPlanned(plan)),
    ),
  ].filter((col) => col !== '');

  return `<section id="whats-next" class="my-12">
  <h2 class="font-display text-3xl font-bold text-foreground mb-6">${escapeHtml(data.title)}</h2>
  <div class="grid gap-8 grid-cols-1 lg:grid-cols-3">
${columns.join('\n')}
  </div>
</section>`;
}
