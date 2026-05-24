// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type {
  LinkedIssueEntry,
  LinkedIssueRelation,
  LinkedIssueStatus,
  LinkedIssuesData,
} from './schema.ts';

interface StatusStyle {
  readonly pill: string;
  readonly icon: string;
  readonly iconColor: string;
  readonly label: string;
}

const STATUS_STYLE: Record<LinkedIssueStatus, StatusStyle> = {
  open: {
    pill: 'bg-primary/10 text-primary',
    icon: 'circle-dot',
    iconColor: 'text-primary',
    label: 'Open',
  },
  closed: {
    pill: 'bg-muted/40 text-muted-foreground',
    icon: 'check-circle',
    iconColor: 'text-muted-foreground',
    label: 'Closed',
  },
  merged: {
    pill: 'bg-success/10 text-success',
    icon: 'check-circle',
    iconColor: 'text-success',
    label: 'Merged',
  },
};

const RELATION_LABEL: Record<LinkedIssueRelation, string> = {
  closes: 'Closes',
  fixes: 'Fixes',
  references: 'References',
  blocks: 'Blocks',
};

function renderIssue(entry: LinkedIssueEntry): string {
  const style = STATUS_STYLE[entry.status];
  const relation = RELATION_LABEL[entry.relation];
  const relationProminent = entry.relation === 'closes' || entry.relation === 'fixes';
  const relationClasses = relationProminent
    ? 'bg-primary/10 text-primary font-semibold'
    : 'bg-muted/30 text-muted-foreground font-medium';
  const safeUrl = escapeHtml(entry.url);
  return `    <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="block rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40 hover:ring-primary/50 hover:shadow-lg transition group">
      <div class="flex items-start gap-3">
        <i data-lucide="${style.icon}" class="h-5 w-5 ${style.iconColor} shrink-0 mt-0.5" aria-hidden="true"></i>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${relationClasses}">${relation}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${style.pill}">${style.label}</span>
            <span class="font-mono text-xs text-muted-foreground">#${entry.number}</span>
          </div>
          <p class="font-display text-base font-semibold text-foreground group-hover:text-primary leading-snug">${escapeHtml(entry.title)}</p>
        </div>
      </div>
    </a>`;
}

export function renderSection(data: LinkedIssuesData, _themeTokens: ThemeTokens): string {
  const items = data.issues.map(renderIssue).join('\n');
  return `<section id="linked-issues" class="my-12">
  <h2 class="mb-6 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <div class="grid gap-3 grid-cols-1 md:grid-cols-2">
${items}
  </div>
</section>`;
}
