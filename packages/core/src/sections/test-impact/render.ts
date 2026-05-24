// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { TestAddedEntry, TestChangedEntry, TestImpactData } from './schema.ts';

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
  return slug || 'test-impact';
}

function renderAddedRow(entry: TestAddedEntry): string {
  return `          <tr class="border-b border-success/15 last:border-0 align-top">
            <td class="px-4 py-3 font-mono text-xs text-foreground break-all">${escapeHtml(entry.testFile)}</td>
            <td class="px-4 py-3 text-sm text-foreground/85">${escapeHtml(entry.coverage)}</td>
          </tr>`;
}

function renderChangedRow(entry: TestChangedEntry): string {
  return `          <tr class="border-b border-warn/15 last:border-0 align-top">
            <td class="px-4 py-3 font-mono text-xs text-foreground break-all">${escapeHtml(entry.testFile)}</td>
            <td class="px-4 py-3 text-sm text-foreground/85">${escapeHtml(entry.change)}</td>
          </tr>`;
}

function renderAddedTable(data: TestImpactData): string {
  if (data.added.length === 0) {
    return `    <div class="rounded-card bg-surface p-5 ring-1 ring-success/20">
      <div class="mb-3 flex items-center gap-2">
        <i data-lucide="plus-circle" class="h-5 w-5 text-success"></i>
        <h3 class="font-display text-lg font-semibold text-success">Tests added</h3>
      </div>
      <p class="text-sm italic text-muted-foreground">No new tests added.</p>
    </div>`;
  }
  const rows = data.added.map(renderAddedRow).join('\n');
  return `    <div class="overflow-hidden rounded-card bg-surface ring-1 ring-success/20">
      <div class="flex items-center gap-2 border-b border-success/20 bg-success/10 px-5 py-3">
        <i data-lucide="plus-circle" class="h-5 w-5 text-success"></i>
        <h3 class="font-display text-lg font-semibold text-success">Tests added</h3>
        <span class="ml-auto rounded-full bg-success/20 px-2 py-0.5 text-xs font-semibold text-success">${data.added.length}</span>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-success/15 bg-success/5 text-left">
            <th class="px-4 py-2 font-display font-semibold text-foreground/80">Test file</th>
            <th class="px-4 py-2 font-display font-semibold text-foreground/80">Coverage</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </div>`;
}

function renderChangedTable(data: TestImpactData): string {
  if (data.changed.length === 0) {
    return `    <div class="rounded-card bg-surface p-5 ring-1 ring-warn/20">
      <div class="mb-3 flex items-center gap-2">
        <i data-lucide="refresh-cw" class="h-5 w-5 text-warn"></i>
        <h3 class="font-display text-lg font-semibold text-warn">Tests changed</h3>
      </div>
      <p class="text-sm italic text-muted-foreground">No existing tests modified.</p>
    </div>`;
  }
  const rows = data.changed.map(renderChangedRow).join('\n');
  return `    <div class="overflow-hidden rounded-card bg-surface ring-1 ring-warn/20">
      <div class="flex items-center gap-2 border-b border-warn/20 bg-warn/10 px-5 py-3">
        <i data-lucide="refresh-cw" class="h-5 w-5 text-warn"></i>
        <h3 class="font-display text-lg font-semibold text-warn">Tests changed</h3>
        <span class="ml-auto rounded-full bg-warn/20 px-2 py-0.5 text-xs font-semibold text-warn">${data.changed.length}</span>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-warn/15 bg-warn/5 text-left">
            <th class="px-4 py-2 font-display font-semibold text-foreground/80">Test file</th>
            <th class="px-4 py-2 font-display font-semibold text-foreground/80">What changed</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </div>`;
}

function renderUncovered(data: TestImpactData): string {
  if (!data.uncovered) return '';
  const areas = data.uncovered.areas
    .map(
      (area) =>
        `        <li class="flex gap-2"><span class="text-warn">•</span><span class="font-mono text-sm text-foreground break-all">${escapeHtml(area)}</span></li>`,
    )
    .join('\n');
  return `
  <div class="mt-6 rounded-card border-l-4 border-warn bg-warn/5 p-5 ring-1 ring-warn/30">
    <div class="flex gap-3">
      <i data-lucide="alert-triangle" class="h-5 w-5 text-warn mt-0.5 shrink-0"></i>
      <div class="flex-1">
        <h3 class="mb-2 font-display font-bold text-warn">Untested areas</h3>
        <p class="mb-3 text-sm text-foreground leading-relaxed">${escapeHtml(data.uncovered.reason)}</p>
        <ul class="space-y-1">
${areas}
        </ul>
      </div>
    </div>
  </div>`;
}

export function renderSection(data: TestImpactData): string {
  const id = `test-impact-${slugify(data.title)}`;
  return `<section id="${id}" class="my-12">
  <h2 class="font-display text-2xl font-bold text-foreground mb-6">${escapeHtml(data.title)}</h2>
  <div class="grid gap-4 md:grid-cols-2">
${renderAddedTable(data)}
${renderChangedTable(data)}
  </div>${renderUncovered(data)}
</section>`;
}
