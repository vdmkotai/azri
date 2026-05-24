// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { BeforeAfterFlowData } from './schema.ts';

function isSafeMermaidSource(source: string): boolean {
  const lowered = source.toLowerCase();
  return (
    !lowered.includes('<script') && !lowered.includes('javascript:') && !lowered.includes('</pre')
  );
}

function sanitizeMermaid(source: string, label: string): string {
  if (isSafeMermaidSource(source)) return source;
  return `graph LR\n  err["${label} Mermaid source rejected: unsafe content"]`;
}

export function renderSection(data: BeforeAfterFlowData, _themeTokens: ThemeTokens): string {
  const before = sanitizeMermaid(data.beforeMermaid, 'Before');
  const after = sanitizeMermaid(data.afterMermaid, 'After');

  return `<section id="before-after-flow" class="my-12">
  <h2 class="mb-6 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <div class="grid grid-cols-2 gap-6">
    <figure class="space-y-3">
      <figcaption class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-danger">
        <i data-lucide="arrow-left-circle" class="h-4 w-4" aria-hidden="true"></i>
        Before
      </figcaption>
      <div class="overflow-x-auto rounded-card bg-surface p-6 shadow-card ring-1 ring-danger/30">
        <pre class="mermaid">${before}</pre>
      </div>
    </figure>
    <figure class="space-y-3">
      <figcaption class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-success">
        <i data-lucide="arrow-right-circle" class="h-4 w-4" aria-hidden="true"></i>
        After
      </figcaption>
      <div class="overflow-x-auto rounded-card bg-surface p-6 shadow-card ring-1 ring-success/30">
        <pre class="mermaid">${after}</pre>
      </div>
    </figure>
  </div>
  <aside class="mt-6 rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40 border-l-4 border-primary">
    <p class="text-xs font-semibold uppercase tracking-wider text-primary mb-2">What changed</p>
    <p class="text-base text-foreground leading-relaxed">${escapeHtml(data.diffSummary)}</p>
  </aside>
</section>`;
}
