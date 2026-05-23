// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { QuoteCalloutData } from './schema.ts';

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

function djb2Hash(value: string): string {
  let hash = 5381;
  for (const ch of value) {
    hash = (hash * 33) ^ (ch.codePointAt(0) ?? 0);
  }
  return Math.abs(Math.trunc(hash)).toString(36);
}

function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function renderAttribution(data: QuoteCalloutData): string {
  if (!data.attribution) return '';
  const sourceText = escapeHtml(data.attribution.source);
  const inner =
    data.attribution.url && isSafeHttpUrl(data.attribution.url)
      ? `<a href="${escapeHtml(data.attribution.url)}" class="text-primary hover:underline">${sourceText}</a>`
      : `<span class="font-mono">${sourceText}</span>`;
  return `
    <footer class="mt-4 text-sm text-muted-foreground">
      — ${inner}
    </footer>`;
}

export function renderSection(data: QuoteCalloutData): string {
  const id = `quote-${djb2Hash(data.quote)}`;
  const escapedQuote = escapeHtml(data.quote);
  return `<section id="${escapeHtml(id)}" class="my-12">
  <blockquote class="rounded-card border-l-4 border-primary bg-surface p-8 shadow-card ring-1 ring-muted/40">
    <p class="font-display text-2xl italic leading-relaxed text-foreground">&ldquo;${escapedQuote}&rdquo;</p>${renderAttribution(data)}
  </blockquote>
</section>`;
}
