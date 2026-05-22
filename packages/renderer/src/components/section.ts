// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeAttr, escapeHtml } from '../utils/escape-html.ts';

export interface SectionProps {
  id: string;
  title: string;
  importance?: string;
  children: string;
}

export function Section(p: SectionProps): string {
  const importance = p.importance ? ` data-importance="${escapeAttr(p.importance)}"` : '';
  return `<section id="${escapeAttr(p.id)}" class="azri-section"${importance}><h2>${escapeHtml(p.title)}</h2><div class="section-body">${p.children}</div></section>`;
}
