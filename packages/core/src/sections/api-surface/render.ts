// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { ApiEndpoint, ApiMethod, ApiSurfaceData } from './schema.ts';

const METHOD_CLASSES: Record<ApiMethod, string> = {
  GET: 'bg-blue-100 text-blue-800 ring-blue-300',
  POST: 'bg-green-100 text-green-800 ring-green-300',
  PUT: 'bg-amber-100 text-amber-800 ring-amber-300',
  PATCH: 'bg-purple-100 text-purple-800 ring-purple-300',
  DELETE: 'bg-red-100 text-red-800 ring-red-300',
};

function renderEndpoint(endpoint: ApiEndpoint): string {
  const methodClass = METHOD_CLASSES[endpoint.method];
  const auth = endpoint.auth
    ? `<span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground"><i data-lucide="lock" class="h-3 w-3"></i>${escapeHtml(endpoint.auth)}</span>`
    : '';
  return `        <tr class="border-b border-muted/30 last:border-0 hover:bg-muted/10">
          <td class="px-4 py-3 align-top">
            <span class="inline-flex justify-center w-16 text-xs font-mono font-bold px-2 py-1 rounded ring-1 ${methodClass}">${endpoint.method}</span>
          </td>
          <td class="px-4 py-3 align-top font-mono text-sm text-foreground break-all">${escapeHtml(endpoint.path)}</td>
          <td class="px-4 py-3 align-top text-sm text-muted-foreground leading-relaxed">${escapeHtml(endpoint.purpose)}</td>
          <td class="px-4 py-3 align-top">${auth}</td>
        </tr>`;
}

export function renderSection(data: ApiSurfaceData, _themeTokens: ThemeTokens): string {
  const rows = data.endpoints.map(renderEndpoint).join('\n');
  return `<section id="api-surface" class="my-12">
  <h2 class="font-display text-3xl font-bold text-foreground mb-6">${escapeHtml(data.title)}</h2>
  <div class="rounded-card bg-surface shadow-card ring-1 ring-muted/40 overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-muted/50 bg-muted/20">
          <th class="px-4 py-3 text-left font-display font-semibold text-foreground w-24">Method</th>
          <th class="px-4 py-3 text-left font-display font-semibold text-foreground">Path</th>
          <th class="px-4 py-3 text-left font-display font-semibold text-foreground">Purpose</th>
          <th class="px-4 py-3 text-left font-display font-semibold text-foreground w-40">Auth</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
}
