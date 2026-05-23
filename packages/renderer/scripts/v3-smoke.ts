// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { writeFile } from 'node:fs/promises';

import { resolveV3Theme } from '../src/design-system/presets-v3/index.ts';
import { renderShell } from '../src/v3/template.ts';

const outputPath = '/tmp/azri-v3-smoke.html';

const theme = resolveV3Theme('default');
const sections = [
  {
    id: 'tldr',
    title: 'TL;DR',
    html: `<div class="rounded-card bg-linear-to-br from-primary/10 to-surface p-6 ring-1 ring-muted/70">
  <p class="max-w-3xl text-2xl font-semibold leading-tight text-foreground">Azri v3 moves rendering to a CDN-first Tailwind v4 foundation with semantic themes and client-side diagrams.</p>
  <div class="mt-6 grid gap-4 md:grid-cols-3">
    <div class="rounded-card bg-surface p-4 shadow-card ring-1 ring-muted"><p class="text-3xl font-bold text-primary">5</p><p class="text-sm text-muted-foreground">theme presets</p></div>
    <div class="rounded-card bg-surface p-4 shadow-card ring-1 ring-muted"><p class="text-3xl font-bold text-success">3</p><p class="text-sm text-muted-foreground">CDN libraries</p></div>
    <div class="rounded-card bg-surface p-4 shadow-card ring-1 ring-muted"><p class="text-3xl font-bold text-warn">0</p><p class="text-sm text-muted-foreground">new npm deps</p></div>
  </div>
</div>`,
  },
  {
    id: 'stack-grid',
    title: 'Stack Grid',
    html: `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <div class="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card ring-1 ring-muted"><img src="https://cdn.simpleicons.org/nextjs/000000" width="28" height="28" alt="Next.js"><span class="font-semibold">Next.js</span></div>
  <div class="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card ring-1 ring-muted"><img src="https://cdn.simpleicons.org/convex/ee342f" width="28" height="28" alt="Convex"><span class="font-semibold">Convex</span></div>
  <div class="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card ring-1 ring-muted"><img src="https://cdn.simpleicons.org/clerk/6c47ff" width="28" height="28" alt="Clerk"><span class="font-semibold">Clerk</span></div>
  <div class="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card ring-1 ring-muted"><img src="https://cdn.simpleicons.org/bun/000000" width="28" height="28" alt="Bun"><span class="font-semibold">Bun</span></div>
</div>`,
  },
  {
    id: 'mermaid-diagram',
    title: 'Mermaid Diagram',
    html: `<pre class="mermaid">graph LR
  A[User] --> B[Frontend] --> C[API] --> D[(Database)]</pre>`,
  },
];

const tocHtml = `<nav aria-label="Table of contents"><ol class="space-y-1">${sections
  .map(
    (section) =>
      `<li><a class="block rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/40 hover:text-primary" href="#${section.id}">${section.title}</a></li>`,
  )
  .join('\n')}</ol></nav>`;
const bodyHtml = sections
  .map(
    (
      section,
    ) => `<section id="${section.id}" class="scroll-mt-8 bg-surface p-6 my-4 rounded-card shadow-card ring-1 ring-muted/70">
  <h2 class="mb-4 font-display text-2xl font-semibold text-primary">${section.title}</h2>
  <div class="text-foreground">${section.html}</div>
</section>`,
  )
  .join('\n');
const html = renderShell({
  title: 'Azri v3 Preview',
  themeCss: theme.themeCss,
  tocHtml,
  bodyHtml,
  pageMetadata: {
    generatedAt: new Date().toISOString(),
    runId: 'v3-smoke',
    repoUrl: 'https://github.com/vdmkotai/azri',
  },
});
await writeFile(outputPath, html, 'utf8');

const sizeKb = Math.max(1, Math.round(Buffer.byteLength(html, 'utf8') / 1024));

console.log(
  `Generated ${outputPath} (${sizeKb} KB) — open in browser to verify Tailwind v4 + Mermaid + Lucide all work`,
);
