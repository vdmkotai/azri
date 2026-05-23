// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { renderMermaidFallback } from '../diagrams/mermaid.ts';

export interface MermaidDiagramProps {
  source: string;
  caption?: string;
  ariaLabel?: string;
}

// DEPRECATED v0.3: client-side mermaid will not need sanitization.
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<\/?(script|foreignObject|iframe)\b[^>]*>/giu, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/giu, '');
}

export function MermaidDiagram(p: MermaidDiagramProps): string {
  void p.ariaLabel;
  void sanitizeSvg;
  return renderMermaidFallback(p.source, p.caption);
}
