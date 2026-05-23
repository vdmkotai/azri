// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export interface PageMetadata {
  readonly generatedAt: string;
  readonly runId: string;
  readonly repoUrl?: string;
  readonly prUrl?: string;
}

export interface ShellOptions {
  readonly title: string;
  readonly themeCss: string;
  readonly tocHtml: string;
  readonly bodyHtml: string;
  readonly pageMetadata: PageMetadata;
}

const csp =
  "default-src 'none'; script-src https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src https://cdn.jsdelivr.net https://cdn.simpleicons.org data:; font-src https://fonts.gstatic.com; frame-ancestors 'none';";

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMetadata(metadata: PageMetadata): string {
  const links = [
    metadata.repoUrl
      ? `<a class="text-primary underline" href="${escapeHtml(metadata.repoUrl)}">Repo</a>`
      : '',
    metadata.prUrl
      ? `<a class="text-primary underline" href="${escapeHtml(metadata.prUrl)}">PR</a>`
      : '',
  ].filter(Boolean);

  return `<div class="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
    <span>Generated ${escapeHtml(metadata.generatedAt)}</span>
    <span>Run ${escapeHtml(metadata.runId)}</span>
    ${links.join('')}
  </div>`;
}

export function renderShell(opts: ShellOptions): string {
  const title = escapeHtml(opts.title);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=EB+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/@mermaid-js/tiny@11/dist/mermaid.tiny.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/lucide@1/dist/umd/lucide.min.js"></script>
  <style type="text/tailwindcss">
${opts.themeCss}
  </style>
</head>
<body class="min-h-screen bg-bg font-body text-foreground antialiased">
  <div class="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-8">
    <aside class="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:overflow-auto">
      <div class="rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/70">
        <p class="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground"><i data-lucide="list-tree" class="h-5 w-5 text-primary"></i>Contents</p>
        ${opts.tocHtml}
      </div>
    </aside>
    <main class="min-w-0">
      <header class="mb-8 rounded-card bg-surface p-8 shadow-card ring-1 ring-muted/70">
        <p class="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-primary">Azri Studio</p>
        <h1 class="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">${title}</h1>
        ${renderMetadata(opts.pageMetadata)}
      </header>
      ${opts.bodyHtml}
    </main>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (globalThis.lucide) {
        globalThis.lucide.createIcons();
      }

      if (globalThis.mermaid) {
        globalThis.mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
      }
    });
  </script>
</body>
</html>`;
}
