// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeAttr, escapeHtml } from '../utils/escape-html.ts';

export interface CitationProps {
  citations: ReadonlyArray<{ file: string; lineStart: number; lineEnd: number; kind: string }>;
  githubBaseUrl?: string;
}

export function CitationFootnote(p: CitationProps): string {
  if (p.citations.length === 0) return '';
  const items = p.citations
    .map((c) => {
      const label = `${c.file}:${c.lineStart}-${c.lineEnd}`;
      const inner = p.githubBaseUrl
        ? `<a href="${escapeAttr(`${p.githubBaseUrl}/${c.file}#L${c.lineStart}-L${c.lineEnd}`)}" rel="noopener">${escapeHtml(label)}</a>`
        : escapeHtml(label);
      return `<li class="citation citation-${escapeAttr(c.kind)}">${inner}</li>`;
    })
    .join('');
  return `<aside class="azri-citations"><h3>Citations</h3><ol>${items}</ol></aside>`;
}
