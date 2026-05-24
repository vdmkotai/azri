// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { GlossaryData, GlossaryTerm } from './schema.ts';

function renderTerm(entry: GlossaryTerm): string {
  const seeAlso =
    entry.seeAlso && entry.seeAlso.length > 0
      ? `
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span class="text-xs uppercase tracking-wider text-muted-foreground/70 self-center">See also</span>
${entry.seeAlso
  .map(
    (ref) =>
      `          <span class="text-xs px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground font-mono">${escapeHtml(ref)}</span>`,
  )
  .join('\n')}
        </div>`
      : '';
  return `      <div class="break-inside-avoid mb-6">
        <dt class="font-mono font-semibold text-primary text-base mb-1.5">${escapeHtml(entry.term)}</dt>
        <dd class="text-sm text-muted-foreground leading-relaxed">${escapeHtml(entry.definition)}</dd>${seeAlso}
      </div>`;
}

export function renderSection(data: GlossaryData, _themeTokens: ThemeTokens): string {
  const sorted = data.terms.toSorted((a, b) =>
    a.term.localeCompare(b.term, undefined, { sensitivity: 'base' }),
  );
  const items = sorted.map((entry) => renderTerm(entry)).join('\n');
  return `<section id="glossary" class="my-12">
  <h2 class="font-display text-3xl font-bold text-foreground mb-6">${escapeHtml(data.title)}</h2>
  <div class="rounded-card bg-surface p-6 shadow-card ring-1 ring-muted/40">
    <dl class="columns-1 md:columns-2 gap-x-8">
${items}
    </dl>
  </div>
</section>`;
}
