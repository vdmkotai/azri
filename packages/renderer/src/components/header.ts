// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeAttr, escapeHtml } from '../utils/escape-html.ts';

export interface HeaderProps {
  title: string;
  summary: string;
  prUrl?: string;
  runMeta?: { runId: string; generatedAt: string; costUsd?: number };
}

export function Header(p: HeaderProps): string {
  const meta = p.runMeta
    ? `<div class="header-meta">Run ${escapeHtml(p.runMeta.runId)} · ${escapeHtml(
        p.runMeta.generatedAt,
      )}${p.runMeta.costUsd === undefined ? '' : ` · $${p.runMeta.costUsd.toFixed(4)}`}</div>`
    : '';
  const link = p.prUrl
    ? `<a class="header-link" href="${escapeAttr(p.prUrl)}" rel="noopener">View on GitHub →</a>`
    : '';
  return `<header class="azri-header"><h1>${escapeHtml(p.title)}</h1><p class="header-summary">${escapeHtml(p.summary)}</p>${link}${meta}</header>`;
}
