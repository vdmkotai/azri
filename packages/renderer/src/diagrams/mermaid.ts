// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../utils/escape-html.ts';

export interface MermaidRenderOptions {
  theme?: 'light' | 'dark';
}

export function renderMermaidFallback(source: string, caption?: string): string {
  const escaped = escapeHtml(source);
  return `
    <figure class="azri-mermaid-fallback">
      <pre class="azri-mermaid-source">${escaped}</pre>
      ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
    </figure>
  `;
}

export async function renderMermaidToSvg(
  source: string,
  _opts: MermaidRenderOptions = {},
): Promise<string> {
  return renderMermaidFallback(source);
}

export function clearMermaidCache(): void {
  // No-op: Mermaid SSR cache was removed in v0.2.2.
}
