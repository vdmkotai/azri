// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeAttr, escapeHtml } from '../utils/escape-html.ts';

export interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock(p: CodeBlockProps): string {
  const lang = p.language ? ` data-lang="${escapeAttr(p.language)}"` : '';
  return `<pre class="azri-code"${lang}><code>${escapeHtml(p.code)}</code></pre>`;
}
