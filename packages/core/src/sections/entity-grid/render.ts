// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { Entity, EntityColor, EntityGridData } from './schema.ts';

interface EntityColorClasses {
  readonly stripe: string;
  readonly tag: string;
  readonly role: string;
}

const COLOR_CLASSES: Record<EntityColor, EntityColorClasses> = {
  blue: { stripe: 'bg-blue-500', tag: 'bg-blue-100 text-blue-900', role: 'text-blue-700' },
  purple: {
    stripe: 'bg-purple-500',
    tag: 'bg-purple-100 text-purple-900',
    role: 'text-purple-700',
  },
  orange: {
    stripe: 'bg-orange-500',
    tag: 'bg-orange-100 text-orange-900',
    role: 'text-orange-700',
  },
  green: { stripe: 'bg-green-500', tag: 'bg-green-100 text-green-900', role: 'text-green-700' },
  pink: { stripe: 'bg-pink-500', tag: 'bg-pink-100 text-pink-900', role: 'text-pink-700' },
  amber: { stripe: 'bg-amber-500', tag: 'bg-amber-100 text-amber-900', role: 'text-amber-700' },
};

function renderEntity(entity: Entity): string {
  const colors = COLOR_CLASSES[entity.color];
  return `    <div class="rounded-card bg-surface shadow-card ring-1 ring-muted/40 overflow-hidden">
      <div class="h-1 ${colors.stripe}"></div>
      <div class="p-5">
        <div class="flex items-baseline justify-between mb-2 gap-3">
          <h3 class="font-display text-xl font-bold text-foreground">${escapeHtml(entity.name)}</h3>
          <span class="text-xs px-2 py-1 rounded ${colors.tag} font-mono">${escapeHtml(entity.tech)}</span>
        </div>
        <p class="text-sm font-semibold ${colors.role} mb-2">${escapeHtml(entity.role)}</p>
        <p class="text-sm text-muted-foreground leading-relaxed">${escapeHtml(entity.description)}</p>
      </div>
    </div>`;
}

export function renderSection(data: EntityGridData, _themeTokens: ThemeTokens): string {
  const entities = data.entities.map(renderEntity).join('\n');
  return `<section id="entity-grid" class="my-12">
  <h2 class="font-display text-3xl font-bold text-foreground mb-6">${escapeHtml(data.title)}</h2>
  <div class="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
${entities}
  </div>
</section>`;
}
