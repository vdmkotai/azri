// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { ProjectOverviewData, ProjectOverviewPersona } from './schema.ts';

function renderPersona(persona: ProjectOverviewPersona): string {
  return `      <li class="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 ring-1 ring-primary/20">
        <i data-lucide="user" class="h-4 w-4 text-primary shrink-0" aria-hidden="true"></i>
        <span class="font-medium text-foreground">${escapeHtml(persona.name)}</span>
        <span class="text-muted-foreground">·</span>
        <span class="text-sm text-muted-foreground">${escapeHtml(persona.motivation)}</span>
      </li>`;
}

export function renderSection(data: ProjectOverviewData, _themeTokens: ThemeTokens): string {
  const personas = data.personas.map(renderPersona).join('\n');
  return `<section id="project-overview" class="mb-12">
  <div class="rounded-card bg-surface p-8 shadow-card ring-1 ring-muted/40 md:p-12">
    <p class="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-primary">Project overview</p>
    <h2 class="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">${escapeHtml(data.headline)}</h2>
    <p class="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">${escapeHtml(data.description)}</p>
    <div class="mt-8">
      <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">Who it's for</p>
      <ul class="flex flex-wrap gap-3">
${personas}
      </ul>
    </div>
  </div>
</section>`;
}
