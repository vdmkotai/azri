// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { resolveV3Theme } from '../design-system/presets-v3/index.ts';
import { renderShell, type PageMetadata } from './template.ts';

export interface V3SectionData {
  readonly id: string;
  readonly title: string;
  readonly placeholder: string;
}

export interface V3RenderInput {
  readonly themeName: string;
  readonly sections: readonly V3SectionData[];
  readonly metadata: PageMetadata;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderToc(sections: readonly V3SectionData[]): string {
  const items = sections
    .map(
      (section) =>
        `<li><a class="block rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/40 hover:text-primary" href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a></li>`,
    )
    .join('\n');

  return `<nav aria-label="Table of contents"><ol class="space-y-1">${items}</ol></nav>`;
}

function renderSection(section: V3SectionData): string {
  return `<section id="${escapeHtml(section.id)}" class="scroll-mt-8 bg-surface p-6 my-4 rounded-card shadow-card ring-1 ring-muted/70">
  <h2 class="mb-4 font-display text-2xl font-semibold text-primary">${escapeHtml(section.title)}</h2>
  <div class="text-foreground">${section.placeholder}</div>
</section>`;
}

export function renderPageV3(input: V3RenderInput): string {
  const theme = resolveV3Theme(input.themeName);
  const tocHtml = renderToc(input.sections);
  const bodyHtml = input.sections.map(renderSection).join('\n');

  return renderShell({
    title: 'Azri v3 Preview',
    themeCss: theme.themeCss,
    tocHtml,
    bodyHtml,
    pageMetadata: input.metadata,
  });
}
