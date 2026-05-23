// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { ComparisonRow, ComparisonTableData } from './schema.ts';

type Change = NonNullable<ComparisonRow['change']>;

const CHANGE_BADGE: Record<Change, string> = {
  added:
    '<span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">+ added</span>',
  removed:
    '<span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-danger/15 text-danger font-medium">− removed</span>',
  changed:
    '<span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-warn/15 text-warn font-medium">~ changed</span>',
  unchanged: '',
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

function renderRow(row: ComparisonRow): string {
  const badge = row.change ? CHANGE_BADGE[row.change] : '';
  return `<tr class="border-b border-muted/30 last:border-0">
          <td class="px-4 py-3 font-medium text-foreground">${escapeHtml(row.aspect)}</td>
          <td class="px-4 py-3 text-muted-foreground">${escapeHtml(row.left)}</td>
          <td class="px-4 py-3 text-foreground">${escapeHtml(row.right)}${badge}</td>
        </tr>`;
}

export function renderSection(data: ComparisonTableData): string {
  const id = `compare-${slugify(data.title)}`;
  const body = data.rows.map(renderRow).join('\n');

  return `<section id="${id}" class="my-12">
  <h2 class="font-display text-2xl font-bold text-foreground mb-4">${escapeHtml(data.title)}</h2>
  <div class="rounded-card bg-surface shadow-card ring-1 ring-muted/40 overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b-2 border-muted/50">
          <th class="px-4 py-3 font-display font-semibold text-foreground text-left bg-muted/20">Aspect</th>
          <th class="px-4 py-3 font-display font-semibold text-foreground text-left bg-danger/5">${escapeHtml(data.leftLabel)}</th>
          <th class="px-4 py-3 font-display font-semibold text-foreground text-left bg-success/5">${escapeHtml(data.rightLabel)}</th>
        </tr>
      </thead>
      <tbody>
${body}
      </tbody>
    </table>
  </div>
</section>`;
}
