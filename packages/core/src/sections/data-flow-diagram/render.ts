// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { DataFlowDiagramData, DataFlowStep } from './schema.ts';

function slugify(value: string): string {
  const cleaned = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/gu, '')
    .trim()
    .replace(/[\s_]+/gu, '-')
    .replace(/-+/gu, '-')
    .slice(0, 60);
  return cleaned || 'flow';
}

function isSafeMermaidSource(source: string): boolean {
  const lowered = source.toLowerCase();
  return (
    !lowered.includes('<script') && !lowered.includes('javascript:') && !lowered.includes('</pre')
  );
}

function renderStep(step: DataFlowStep): string {
  return `    <li class="flex gap-4 border-l-2 border-primary pl-4 py-1">
      <span class="font-mono text-sm font-bold text-primary shrink-0 w-6 text-right">${step.number}</span>
      <span class="text-sm text-foreground leading-relaxed">${escapeHtml(step.action)}</span>
    </li>`;
}

export function renderSection(data: DataFlowDiagramData, _themeTokens: ThemeTokens): string {
  const id = `data-flow-${slugify(data.title)}`;
  const safeSource = isSafeMermaidSource(data.mermaidSource)
    ? data.mermaidSource
    : 'flowchart LR\n  err["Mermaid source rejected: unsafe content"]';
  const steps = data.steps.map(renderStep).join('\n');
  const notes = data.notes
    ? `
  <div class="mt-5 rounded-card bg-muted/20 border border-muted/40 p-4">
    <p class="text-sm text-muted-foreground leading-relaxed"><span class="font-semibold text-foreground">Notes:</span> ${escapeHtml(data.notes)}</p>
  </div>`
    : '';

  return `<section id="${escapeHtml(id)}" class="my-12">
  <h2 class="mb-4 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <div class="overflow-x-auto rounded-card bg-surface p-6 shadow-card ring-1 ring-muted/40 mb-6">
    <pre class="mermaid">${safeSource}</pre>
  </div>
  <ol class="space-y-2">
${steps}
  </ol>${notes}
</section>`;
}
