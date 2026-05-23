// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { DataTableColumn, DataTableData } from './schema.ts';

type Align = 'left' | 'center' | 'right';

const ALIGN_CLASS: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
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

function isNumericString(value: string): boolean {
  if (value.trim() === '') return false;
  return !Number.isNaN(Number(value));
}

function resolveAligns(columns: readonly DataTableColumn[], rows: DataTableData['rows']): Align[] {
  return columns.map((column) => {
    if (column.align) return column.align;
    if (rows.length === 0) return 'left';
    const allNumeric = rows.every((row) => {
      const value = row[column.key];
      if (typeof value === 'number') return true;
      if (typeof value === 'string') return isNumericString(value);
      return false;
    });
    return allNumeric ? 'right' : 'left';
  });
}

export function renderSection(data: DataTableData): string {
  const id = `table-${slugify(data.title)}`;
  const aligns = resolveAligns(data.columns, data.rows);

  const headers = data.columns
    .map(
      (column, idx) =>
        `<th class="px-4 py-3 font-display font-semibold text-foreground ${ALIGN_CLASS[aligns[idx]!]}">${escapeHtml(column.label)}</th>`,
    )
    .join('');

  const body = data.rows
    .map((row) => {
      const cells = data.columns
        .map((column, idx) => {
          const raw = row[column.key];
          const display = raw === undefined || raw === null ? '' : String(raw);
          return `<td class="px-4 py-3 text-foreground ${ALIGN_CLASS[aligns[idx]!]}">${escapeHtml(display)}</td>`;
        })
        .join('');
      return `<tr class="border-b border-muted/30 last:border-0 hover:bg-muted/10">${cells}</tr>`;
    })
    .join('');

  const caption = data.caption
    ? `\n  <p class="mt-3 text-sm text-muted-foreground italic">${escapeHtml(data.caption)}</p>`
    : '';

  return `<section id="${id}" class="my-12">
  <h2 class="font-display text-2xl font-bold text-foreground mb-4">${escapeHtml(data.title)}</h2>
  <div class="rounded-card bg-surface shadow-card ring-1 ring-muted/40 overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-muted/50 bg-muted/20">${headers}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>${caption}
</section>`;
}
