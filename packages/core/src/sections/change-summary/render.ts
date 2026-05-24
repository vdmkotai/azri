// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type {
  ChangeSummaryData,
  ChangeSummaryFile,
  ChangeSummaryFileKind,
  ChangeSummaryGroup,
} from './schema.ts';

interface KindStyle {
  readonly pill: string;
  readonly label: string;
}

const KIND_STYLE: Record<ChangeSummaryFileKind, KindStyle> = {
  added: { pill: 'bg-success/10 text-success ring-success/30', label: 'added' },
  modified: { pill: 'bg-warn/10 text-warn ring-warn/30', label: 'modified' },
  removed: { pill: 'bg-danger/10 text-danger ring-danger/30', label: 'removed' },
};

function slugify(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 64);
  return slug || fallback;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function renderFileRow(file: ChangeSummaryFile): string {
  const style = KIND_STYLE[file.kind];
  const bytes = file.bytesChanged === undefined ? '' : formatBytes(file.bytesChanged);
  const bytesCell = `<td class="px-4 py-2 text-right font-mono text-xs text-muted-foreground">${escapeHtml(bytes)}</td>`;
  return `          <tr class="border-b border-muted/30 last:border-0 hover:bg-muted/10">
            <td class="px-4 py-2"><span class="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ring-1 ${style.pill}">${style.label}</span></td>
            <td class="px-4 py-2 font-mono text-sm text-foreground break-all">${escapeHtml(file.path)}</td>
            ${bytesCell}
          </tr>`;
}

function renderGroup(group: ChangeSummaryGroup, index: number): string {
  const rows = group.files.map(renderFileRow).join('\n');
  const groupId = `change-summary-${index}-${slugify(group.module, `group-${index}`)}`;
  return `  <article id="${escapeHtml(groupId)}" class="rounded-card bg-surface p-6 shadow-card ring-1 ring-muted/40">
    <header class="mb-4">
      <h3 class="font-display text-xl font-bold text-foreground">${escapeHtml(group.module)}</h3>
      <p class="mt-1 text-sm text-muted-foreground leading-relaxed">${escapeHtml(group.rationale)}</p>
    </header>
    <div class="overflow-x-auto rounded-md ring-1 ring-muted/30">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-muted/50 bg-muted/20">
            <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kind</th>
            <th class="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Path</th>
            <th class="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Δ</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </div>
  </article>`;
}

export function renderSection(data: ChangeSummaryData, _themeTokens: ThemeTokens): string {
  const groups = data.groups.map((group, index) => renderGroup(group, index)).join('\n');
  return `<section id="change-summary" class="my-12">
  <h2 class="mb-6 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <div class="space-y-6">
${groups}
  </div>
</section>`;
}
