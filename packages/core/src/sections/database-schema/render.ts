// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { DatabaseKind, DatabaseSchemaData, DatabaseTable } from './schema.ts';

interface KindStyle {
  readonly pill: string;
  readonly label: string;
}

const KIND_STYLE: Record<DatabaseKind, KindStyle> = {
  sql: { pill: 'bg-primary/10 text-primary ring-primary/30', label: 'SQL' },
  document: { pill: 'bg-success/10 text-success ring-success/30', label: 'Document' },
  kv: { pill: 'bg-warn/10 text-warn ring-warn/30', label: 'Key/Value' },
  graph: { pill: 'bg-danger/10 text-danger ring-danger/30', label: 'Graph' },
};

function renderField(field: DatabaseTable['fields'][number]): string {
  const notes = field.notes
    ? `<td class="px-4 py-2 text-sm text-muted-foreground">${escapeHtml(field.notes)}</td>`
    : '<td class="px-4 py-2 text-sm text-muted-foreground/40">—</td>';
  return `        <tr class="border-b border-muted/30 last:border-0 hover:bg-muted/10">
          <td class="px-4 py-2 font-mono text-sm font-medium text-foreground">${escapeHtml(field.name)}</td>
          <td class="px-4 py-2 font-mono text-sm text-primary">${escapeHtml(field.type)}</td>
          ${notes}
        </tr>`;
}

function renderTable(table: DatabaseTable): string {
  const style = KIND_STYLE[table.kind];
  const fields = table.fields.map(renderField).join('\n');
  return `  <div class="rounded-card bg-surface shadow-card ring-1 ring-muted/40 overflow-hidden">
    <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-muted/40">
      <div class="flex items-center gap-3 min-w-0">
        <i data-lucide="table" class="h-5 w-5 text-muted-foreground shrink-0"></i>
        <h3 class="font-display text-xl font-bold text-foreground font-mono truncate">${escapeHtml(table.name)}</h3>
      </div>
      <span class="inline-flex shrink-0 text-xs px-2.5 py-1 rounded-full ring-1 font-medium uppercase tracking-wider ${style.pill}">${escapeHtml(style.label)}</span>
    </div>
    <p class="px-5 pt-4 pb-2 text-sm text-muted-foreground leading-relaxed">${escapeHtml(table.purpose)}</p>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-muted/50 bg-muted/20">
            <th class="px-4 py-2 text-left font-display font-semibold text-foreground">Field</th>
            <th class="px-4 py-2 text-left font-display font-semibold text-foreground">Type</th>
            <th class="px-4 py-2 text-left font-display font-semibold text-foreground">Notes</th>
          </tr>
        </thead>
        <tbody>
${fields}
        </tbody>
      </table>
    </div>
  </div>`;
}

export function renderSection(data: DatabaseSchemaData, _themeTokens: ThemeTokens): string {
  const tables = data.tables.map(renderTable).join('\n');
  return `<section id="database-schema" class="my-12">
  <h2 class="font-display text-3xl font-bold text-foreground mb-6">${escapeHtml(data.title)}</h2>
  <div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
${tables}
  </div>
</section>`;
}
