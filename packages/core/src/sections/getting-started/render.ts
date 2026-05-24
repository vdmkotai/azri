// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { GettingStartedData, GettingStartedPrereq, GettingStartedStep } from './schema.ts';

const ICON_COLOR_HEX = '3b82f6';

function renderPrereq(prereq: GettingStartedPrereq): string {
  const version = prereq.version
    ? `<div class="mt-1 text-xs font-mono text-muted-foreground">${escapeHtml(prereq.version)}</div>`
    : '';
  const icon = prereq.slug
    ? `<img src="https://cdn.simpleicons.org/${encodeURIComponent(prereq.slug)}/${ICON_COLOR_HEX}" width="28" height="28" alt="${escapeHtml(prereq.tool)}" class="shrink-0" loading="lazy">`
    : `<div class="flex items-center justify-center h-7 w-7 rounded bg-primary/10 text-primary shrink-0"><i data-lucide="package" class="h-4 w-4"></i></div>`;
  return `      <div class="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card ring-1 ring-muted/40">
        ${icon}
        <div class="min-w-0">
          <div class="font-display text-base font-semibold text-foreground truncate">${escapeHtml(prereq.tool)}</div>
          ${version}
        </div>
      </div>`;
}

function renderStep(step: GettingStartedStep, idx: number): string {
  const num = idx + 1;
  return `      <li class="flex gap-4">
        <div class="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-bg font-display font-bold text-sm shrink-0">${num}</div>
        <div class="flex-1 min-w-0">
          <p class="text-base text-foreground leading-relaxed mb-2">${escapeHtml(step.description)}</p>
          <pre class="bg-zinc-900 text-zinc-100 p-4 rounded-md overflow-x-auto text-sm font-mono leading-relaxed"><code>${escapeHtml(step.command)}</code></pre>
        </div>
      </li>`;
}

export function renderSection(data: GettingStartedData, _themeTokens: ThemeTokens): string {
  const prereqs = data.prereqs.map(renderPrereq).join('\n');
  const steps = data.steps.map(renderStep).join('\n');
  return `<section id="getting-started" class="my-12">
  <h2 class="font-display text-3xl font-bold text-foreground mb-6">${escapeHtml(data.title)}</h2>
  <div class="mb-8">
    <h3 class="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">Prerequisites</h3>
    <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
${prereqs}
    </div>
  </div>
  <div>
    <h3 class="font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">Steps</h3>
    <ol class="space-y-5">
${steps}
    </ol>
  </div>
</section>`;
}
