// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { CodeWalkthroughData } from './schema.ts';

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

function slugifyPath(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[/.]/gu, '-')
    .replace(/[^\w-]/gu, '')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '')
    .slice(0, 80);
  return cleaned || 'snippet';
}

export function renderSection(data: CodeWalkthroughData): string {
  const id = `walkthrough-${slugifyPath(data.filePath)}`;
  const filePath = escapeHtml(data.filePath);
  const meta = data.lineRange ? `${filePath} : ${escapeHtml(data.lineRange)}` : filePath;
  const annotations = data.annotations
    .map(
      (
        annotation,
      ) => `      <div class="rounded-md border-l-4 border-primary bg-surface p-4 shadow-sm ring-1 ring-muted/40">
        <div class="mb-1 font-mono text-xs text-muted-foreground">line ${annotation.lineOffset + 1}</div>
        <p class="text-sm leading-relaxed text-foreground">${escapeHtml(annotation.text)}</p>
      </div>`,
    )
    .join('\n');
  return `<section id="${escapeHtml(id)}" class="my-12">
  <h2 class="mb-2 font-display text-2xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <div class="mb-4 font-mono text-sm text-muted-foreground">${meta}</div>
  <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
    <div class="overflow-x-auto rounded-card bg-zinc-900 p-5 shadow-card ring-1 ring-muted/40">
      <pre class="font-mono text-sm leading-relaxed text-zinc-100"><code class="language-${escapeHtml(data.language)}">${escapeHtml(data.code)}</code></pre>
    </div>
    <aside class="space-y-3">
${annotations}
    </aside>
  </div>
</section>`;
}
