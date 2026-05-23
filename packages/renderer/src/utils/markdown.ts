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

function normalizeSectionHeadings(html: string): string {
  const withoutH1 = html.replace(/<\/?h1\b[^>]*>/giu, '');
  return withoutH1
    .replace(/<h3\b([^>]*)>/giu, '<h4$1>')
    .replace(/<\/h3>/giu, '</h4>')
    .replace(/<h2\b([^>]*)>/giu, '<h3$1>')
    .replace(/<\/h2>/giu, '</h3>');
}

export function markdownToHtml(md: string): string {
  if (!md) return '';
  try {
    const rendered = marked.parse(md, { async: false }) as string;
    return normalizeSectionHeadings(sanitize(rendered));
  } catch {
    return `<p>${escapeHtml(md)}</p>`;
  }
}
