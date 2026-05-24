// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { BreakingChange, Deprecation, MigrationNotesData } from './schema.ts';

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
  return slug || 'migration-notes';
}

function renderBreakingChange(change: BreakingChange, index: number): string {
  const steps = change.migrationSteps
    .map(
      (step, idx) => `          <li class="flex gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-bg font-mono text-xs font-bold">${idx + 1}</span>
            <span class="text-sm leading-relaxed text-foreground pt-0.5">${escapeHtml(step)}</span>
          </li>`,
    )
    .join('\n');

  return `    <article class="overflow-hidden rounded-card bg-surface ring-1 ring-danger/30 shadow-card">
      <header class="border-b border-danger/20 bg-danger/10 px-5 py-4">
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-danger px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-bg">Breaking ${index + 1}</span>
          <h3 class="font-display text-lg font-bold text-foreground">${escapeHtml(change.what)}</h3>
        </div>
      </header>
      <div class="grid gap-4 p-5 md:grid-cols-2">
        <div>
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-danger">Before</p>
          <pre tabindex="0" class="overflow-x-auto rounded-md bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100 ring-1 ring-zinc-700 focus:outline-2 focus:outline-primary"><code>${escapeHtml(change.before)}</code></pre>
        </div>
        <div>
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-success">After</p>
          <pre tabindex="0" class="overflow-x-auto rounded-md bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100 ring-1 ring-zinc-700 focus:outline-2 focus:outline-primary"><code>${escapeHtml(change.after)}</code></pre>
        </div>
      </div>
      <div class="border-t border-muted/30 bg-muted/5 p-5">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">Migration steps</p>
        <ol class="space-y-2">
${steps}
        </ol>
      </div>
    </article>`;
}

function renderDeprecations(deprecations: readonly Deprecation[]): string {
  const items = deprecations
    .map((dep) => {
      const eta = dep.removalETA
        ? `<span class="ml-2 rounded-full bg-warn/20 px-2 py-0.5 text-xs font-semibold text-warn">Removal: ${escapeHtml(dep.removalETA)}</span>`
        : '';
      return `      <li class="rounded-card bg-surface p-4 ring-1 ring-warn/30">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <i data-lucide="clock-alert" class="h-4 w-4 text-warn"></i>
          <span class="font-display font-semibold text-foreground">${escapeHtml(dep.what)}</span>${eta}
        </div>
        <p class="text-sm text-foreground/80">
          <span class="font-semibold text-warn">Use instead:</span>
          <code class="rounded bg-muted/30 px-1.5 py-0.5 font-mono text-xs text-foreground">${escapeHtml(dep.replacement)}</code>
        </p>
      </li>`;
    })
    .join('\n');

  return `
  <div class="mt-8">
    <h3 class="mb-3 font-display text-lg font-semibold text-warn">Deprecations</h3>
    <ul class="space-y-3">
${items}
    </ul>
  </div>`;
}

export function renderSection(data: MigrationNotesData): string {
  if (!data.isBreaking && (!data.deprecations || data.deprecations.length === 0)) {
    return '';
  }

  const id = `migration-notes-${slugify(data.title)}`;
  const changes =
    data.isBreaking && data.breakingChanges.length > 0
      ? `  <div class="space-y-6">
${data.breakingChanges.map((change, idx) => renderBreakingChange(change, idx)).join('\n')}
  </div>`
      : '';

  const deprecations =
    data.deprecations && data.deprecations.length > 0 ? renderDeprecations(data.deprecations) : '';

  return `<section id="${id}" class="my-12">
  <div class="mb-6 flex items-center gap-3">
    <i data-lucide="alert-octagon" class="h-6 w-6 text-danger"></i>
    <h2 class="font-display text-2xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  </div>
${changes}${deprecations}
</section>`;
}
