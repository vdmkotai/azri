// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeAttr } from '../utils/escape-html.ts';

export interface MermaidDiagramProps {
  svgString: string;
  caption?: string;
  ariaLabel?: string;
}

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<\/?(script|foreignObject|iframe)\b[^>]*>/giu, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/giu, '');
}

export function MermaidDiagram(p: MermaidDiagramProps): string {
  const aria = p.ariaLabel ? ` aria-label="${escapeAttr(p.ariaLabel)}"` : '';
  const caption = p.caption ? `<figcaption>${escapeAttr(p.caption)}</figcaption>` : '';
  return `<figure class="azri-mermaid"${aria}>${sanitizeSvg(p.svgString)}${caption}</figure>`;
}
