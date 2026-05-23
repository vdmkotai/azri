// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { getSection } from '../../../core/src/sections/registry.ts';
import type { ProducedSection } from '../../../core/src/sections/types.ts';
import { resolveV3Theme } from '../design-system/presets-v3/index.ts';
import { renderShell, type PageMetadata } from './template.ts';

export interface V3RenderInput {
  readonly themeName: string;
  readonly sections: readonly ProducedSection[];
  readonly metadata: PageMetadata;
  readonly title?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderToc(sections: readonly ProducedSection[]): string {
  const items = sections
    .map((section) => {
      const type = getSection(section.id);
      return `<li><a class="block rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/40 hover:text-primary" href="#${escapeHtml(section.id)}">${escapeHtml(type.name)}</a></li>`;
    })
    .join('\n');

  return `<nav aria-label="Table of contents"><ol class="space-y-1">${items}</ol></nav>`;
}

function renderSection(section: ProducedSection, theme: ReturnType<typeof resolveV3Theme>): string {
  const type = getSection(section.id);
  return `<section id="${escapeHtml(section.id)}" class="scroll-mt-8 my-4">
  ${type.render(section.data, theme)}
</section>`;
}

export function renderSectionV3Bytes(
  section: ProducedSection,
  themeName: string | undefined,
): number {
  return Buffer.byteLength(renderSection(section, resolveV3Theme(themeName)), 'utf8');
}

export function renderPageV3(input: V3RenderInput): string {
  const theme = resolveV3Theme(input.themeName);
  const tocHtml = renderToc(input.sections);
  const bodyHtml = input.sections.map((section) => renderSection(section, theme)).join('\n');

  return renderShell({
    title: input.title ?? 'Azri v3 Preview',
    themeCss: theme.themeCss,
    tocHtml,
    bodyHtml,
    pageMetadata: input.metadata,
  });
}
