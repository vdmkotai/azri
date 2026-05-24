// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { DeploymentEntry, DeploymentHost, DeploymentMapData } from './schema.ts';

const ICON_COLOR_HEX = '3b82f6';

const HOST_ICON: Record<DeploymentHost, string> = {
  vercel: 'vercel',
  railway: 'railway',
  flyio: 'flydotio',
  cloudflare: 'cloudflare',
  aws: 'amazonaws',
  gcp: 'googlecloud',
  'self-hosted': 'docker',
  cdn: 'cloudflare',
  other: 'server',
};

const HOST_LABEL: Record<DeploymentHost, string> = {
  vercel: 'Vercel',
  railway: 'Railway',
  flyio: 'Fly.io',
  cloudflare: 'Cloudflare',
  aws: 'AWS',
  gcp: 'Google Cloud',
  'self-hosted': 'Self-hosted',
  cdn: 'CDN',
  other: 'Other',
};

function renderUrl(url: string): string {
  const safe = escapeHtml(url);
  return `        <a href="${safe}" rel="noopener noreferrer" class="block mt-3 text-xs text-primary hover:underline font-mono break-all">${safe}</a>`;
}

function renderRegion(region: string): string {
  return `<span class="text-xs px-2 py-0.5 rounded bg-muted/30 text-muted-foreground font-mono">${escapeHtml(region)}</span>`;
}

function renderNotes(notes: string): string {
  return `\n        <p class="mt-3 text-xs text-muted-foreground leading-relaxed">${escapeHtml(notes)}</p>`;
}

function renderEntry(entry: DeploymentEntry): string {
  const slug = encodeURIComponent(HOST_ICON[entry.host]);
  const hostLabel = HOST_LABEL[entry.host];
  const region = entry.region ? renderRegion(entry.region) : '';
  const url = entry.url ? `\n${renderUrl(entry.url)}` : '';
  const notes = entry.notes ? renderNotes(entry.notes) : '';
  return `    <div class="rounded-card bg-surface p-5 shadow-card ring-1 ring-muted/40 hover:shadow-lg transition">
      <div class="flex items-center gap-3 mb-3">
        <img src="https://cdn.simpleicons.org/${slug}/${ICON_COLOR_HEX}" width="36" height="36" alt="${escapeHtml(hostLabel)}" class="rounded" loading="lazy">
        <div class="flex-1 min-w-0">
          <div class="font-display text-lg font-bold text-foreground truncate">${escapeHtml(entry.component)}</div>
          <div class="text-xs text-muted-foreground">${escapeHtml(hostLabel)}</div>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 mb-1">
        <span class="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">${escapeHtml(entry.runtime)}</span>
        ${region}
      </div>${notes}${url}
    </div>`;
}

export function renderSection(data: DeploymentMapData, _themeTokens: ThemeTokens): string {
  const cards = data.deployments.map(renderEntry).join('\n');
  return `<section id="deployment-map" class="my-12">
  <h2 class="mb-6 font-display text-3xl font-bold text-foreground">${escapeHtml(data.title)}</h2>
  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
${cards}
  </div>
</section>`;
}
