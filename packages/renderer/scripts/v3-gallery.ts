// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { writeFile } from 'node:fs/promises';

import * as registeredSections from '../../core/src/sections/index.ts';
import { getSection, listSections } from '../../core/src/sections/registry.ts';
import { PRESETS_V3, resolveV3Theme } from '../src/design-system/presets-v3/index.ts';
import { renderShell } from '../src/v3/template.ts';
import { GALLERY_MOCKS } from './v3-gallery-mocks.ts';

void registeredSections;

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

const THEMES = Object.keys(PRESETS_V3);

const orderedIds = listSections().map((section) => section.id);

const missingMocks = orderedIds.filter((id) => !(id in GALLERY_MOCKS));
if (missingMocks.length > 0) {
  console.error(`Missing mock data for: ${missingMocks.join(', ')}`);
  process.exit(1);
}

interface RenderedSection {
  readonly id: string;
  readonly name: string;
  readonly html: string;
}

function renderSectionsForTheme(themeName: string): RenderedSection[] {
  const theme = resolveV3Theme(themeName);
  return orderedIds.map((id) => {
    const type = getSection(id);
    const data = GALLERY_MOCKS[id];
    const parsed = type.schema.parse(data);
    return { id, name: type.name, html: type.render(parsed, theme) };
  });
}

function buildToc(sections: readonly RenderedSection[]): string {
  const items = sections
    .map(
      (section) =>
        `      <li><a class="block rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/40 hover:text-primary" href="#${escapeHtml(section.id)}">${escapeHtml(section.name)}</a></li>`,
    )
    .join('\n');

  return `<nav aria-label="Section gallery contents">
    <ol class="space-y-1">
${items}
    </ol>
  </nav>`;
}

function buildBody(sections: readonly RenderedSection[]): string {
  return sections
    .map(
      (section) => `<section id="${escapeHtml(section.id)}" class="scroll-mt-8 my-4">
  <p class="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">${escapeHtml(section.id)}</p>
  ${section.html}
</section>`,
    )
    .join('\n');
}

const generatedAt = new Date().toISOString();

for (const themeName of THEMES) {
  const theme = resolveV3Theme(themeName);
  const sections = renderSectionsForTheme(themeName);
  const tocHtml = buildToc(sections);
  const bodyHtml = buildBody(sections);
  const html = renderShell({
    title: `Section gallery — ${themeName}`,
    themeCss: theme.themeCss,
    tocHtml,
    bodyHtml,
    pageMetadata: {
      generatedAt,
      runId: `v3-gallery-${themeName}`,
    },
  });
  const outputPath = `/tmp/azri-v3-gallery-${themeName}.html`;
  await writeFile(outputPath, html, 'utf8');
  const sizeKb = Math.max(1, Math.round(Buffer.byteLength(html, 'utf8') / 1024));
  console.log(`Wrote ${outputPath} (${sizeKb} KB)`);
}

console.log(
  `\nGenerated ${THEMES.length} gallery files in /tmp/azri-v3-gallery-*.html. Open them all to verify.`,
);
