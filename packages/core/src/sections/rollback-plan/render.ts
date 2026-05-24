// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type {
  RollbackComplexity,
  RollbackDataMigration,
  RollbackPlanData,
  RollbackStep,
} from './schema.ts';

interface ComplexityStyle {
  readonly pill: string;
  readonly label: string;
  readonly icon: string;
}

const COMPLEXITY_STYLE: Record<RollbackComplexity, ComplexityStyle> = {
  simple: {
    pill: 'bg-success/15 text-success',
    label: 'Simple',
    icon: 'rotate-ccw',
  },
  moderate: {
    pill: 'bg-warn/15 text-warn',
    label: 'Moderate',
    icon: 'alert-triangle',
  },
  complex: {
    pill: 'bg-danger/15 text-danger',
    label: 'Complex',
    icon: 'alert-octagon',
  },
};

function renderStep(step: RollbackStep): string {
  return `      <li class="flex gap-4">
        <div class="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-bg font-display font-bold text-sm shrink-0">${step.number}</div>
        <div class="flex-1 min-w-0">
          <p class="text-base text-foreground leading-relaxed mb-2">${escapeHtml(step.description)}</p>
          <pre class="bg-zinc-900 text-zinc-100 p-4 rounded-md overflow-x-auto text-sm font-mono leading-relaxed"><code>${escapeHtml(step.command)}</code></pre>
        </div>
      </li>`;
}

function renderWarnings(warnings?: readonly string[]): string {
  if (!warnings || warnings.length === 0) return '';
  const items = warnings
    .map(
      (warning) =>
        `        <li class="flex gap-2 items-start text-sm text-foreground"><i data-lucide="alert-triangle" class="h-4 w-4 text-warn shrink-0 mt-0.5" aria-hidden="true"></i><span>${escapeHtml(warning)}</span></li>`,
    )
    .join('\n');
  return `
  <aside class="azri-callout azri-callout-warn mt-8 rounded-card bg-warn/5 ring-1 ring-warn/30 border-l-4 border-warn p-5">
    <div class="callout-label text-xs font-semibold uppercase tracking-wider text-warn mb-2">Warnings</div>
    <ul class="callout-body space-y-2 list-none">
${items}
    </ul>
  </aside>`;
}

function renderDataMigration(migration?: RollbackDataMigration): string {
  if (!migration) return '';
  const reversible = migration.reversible;
  const containerClasses = reversible
    ? 'bg-surface ring-muted/40'
    : 'bg-danger/5 ring-danger/40 border-l-4 border-danger';
  const icon = reversible ? 'database' : 'database-zap';
  const iconColor = reversible ? 'text-primary' : 'text-danger';
  const headingColor = reversible ? 'text-foreground' : 'text-danger';
  const pillClasses = reversible
    ? 'bg-success/15 text-success'
    : 'bg-danger/15 text-danger font-bold';
  const pillLabel = reversible ? 'Reversible' : 'Irreversible';
  return `
  <div class="mt-6 rounded-card ${containerClasses} ring-1 p-5 shadow-card">
    <div class="flex items-start gap-3">
      <i data-lucide="${icon}" class="h-5 w-5 ${iconColor} shrink-0 mt-0.5" aria-hidden="true"></i>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <h3 class="font-display text-base font-bold ${headingColor}">Data migration</h3>
          <span class="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${pillClasses}">${pillLabel}</span>
        </div>
        <p class="text-sm text-foreground leading-relaxed">${escapeHtml(migration.notes)}</p>
      </div>
    </div>
  </div>`;
}

export function renderSection(data: RollbackPlanData, _themeTokens: ThemeTokens): string {
  const style = COMPLEXITY_STYLE[data.complexity];
  const sortedSteps = [...data.steps].toSorted((a, b) => a.number - b.number);
  const steps = sortedSteps.map((step) => renderStep(step)).join('\n');
  return `<section id="rollback-plan" class="my-12">
  <div class="flex flex-wrap items-center gap-3 mb-6">
    <h2 class="font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
    <span class="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider ${style.pill}"><i data-lucide="${style.icon}" class="h-3.5 w-3.5" aria-hidden="true"></i>${style.label}</span>
  </div>
  <ol class="space-y-5 list-none">
${steps}
  </ol>${renderWarnings(data.warnings)}${renderDataMigration(data.dataMigration)}
</section>`;
}
