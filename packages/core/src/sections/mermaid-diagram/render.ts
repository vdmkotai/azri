// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { MermaidDiagramData } from './schema.ts';

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

function slugify(value: string): string {
  const cleaned = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/gu, '')
    .trim()
    .replace(/[\s_]+/gu, '-')
    .replace(/-+/gu, '-')
    .slice(0, 60);
  return cleaned || 'diagram';
}

function isSafeMermaidSource(source: string): boolean {
  const lowered = source.toLowerCase();
  return (
    !lowered.includes('<script') && !lowered.includes('javascript:') && !lowered.includes('</pre')
  );
}

export function renderSection(data: MermaidDiagramData): string {
  const id = `mermaid-${slugify(data.title)}`;
  const safeSource = isSafeMermaidSource(data.source)
    ? data.source
    : 'graph LR\n  err["Mermaid source rejected: unsafe content"]';
  const caption = data.caption
    ? `\n  <p class="mt-3 text-sm italic text-muted-foreground">${escapeHtml(data.caption)}</p>`
    : '';
  return `<section id="${escapeHtml(id)}" class="my-12">
  <h2 class="mb-4 font-display text-2xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <div class="overflow-x-auto rounded-card bg-surface p-6 shadow-card ring-1 ring-muted/40">
    <pre class="mermaid">${safeSource}</pre>
  </div>${caption}
</section>`;
}
