// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { marked } from 'marked';
import { escapeHtml } from './escape-html.ts';

marked.setOptions({
  gfm: true,
  breaks: false,
});

const FORBIDDEN_TAG_RE = /<\/?(script|style|iframe|object|embed|form|input|button)\b[^>]*>/giu;
const ON_ATTR_RE = /\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/giu;
const JS_PROTO_RE =
  /\s(href|src)\s*=\s*("[^"]*javascript:[^"]*"|'[^']*javascript:[^']*'|javascript:[^\s>]+)/giu;

function sanitize(html: string): string {
  return html.replace(FORBIDDEN_TAG_RE, '').replace(ON_ATTR_RE, '').replace(JS_PROTO_RE, '');
}

export function markdownToHtml(md: string): string {
  if (!md) return '';
  try {
    const rendered = marked.parse(md, { async: false }) as string;
    return sanitize(rendered);
  } catch {
    return `<p>${escapeHtml(md)}</p>`;
  }
}
