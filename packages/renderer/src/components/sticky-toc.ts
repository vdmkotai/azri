// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeAttr, escapeHtml } from '../utils/escape-html.ts';

export interface TocSection {
  id: string;
  title: string;
  importance?: string;
}

export interface StickyTOCProps {
  sections: ReadonlyArray<TocSection>;
}

export function StickyTOC(p: StickyTOCProps): string {
  const items = p.sections
    .map(
      (s, i) =>
        `<li><a href="#${escapeAttr(s.id)}"><span class="toc-num">${i + 1}.</span> ${escapeHtml(s.title)}</a></li>`,
    )
    .join('');
  return `<nav class="azri-toc" aria-label="Contents"><p class="toc-title">Contents</p><ol>${items}</ol></nav>`;
}
