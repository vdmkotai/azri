// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { EntityCardData, EntityColor, EntitySubSection } from './schema.ts';

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

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-+|-+$/gu, '')
      .slice(0, 60) || 'entity'
  );
}

function renderSubSection(section: EntitySubSection): string {
  return `      <div class="mt-6 pt-6 border-t border-muted/50">
        <h3 class="font-display text-xl font-semibold text-foreground mb-2">${escapeHtml(section.heading)}</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">${escapeHtml(section.body)}</p>
      </div>`;
}

export function renderSection(data: EntityCardData, _themeTokens: ThemeTokens): string {
  const colors = COLOR_CLASSES[data.entity.color];
  const sectionId = `entity-card-${slugify(data.entity.name)}`;
  const subSections = data.sections.map(renderSubSection).join('\n');
  return `<section id="${sectionId}" class="my-12">
  <div class="rounded-card bg-surface shadow-card ring-1 ring-muted/40 overflow-hidden">
    <div class="h-2 ${colors.stripe}"></div>
    <div class="p-8">
      <div class="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
        <h2 class="font-display text-3xl font-bold text-foreground">${escapeHtml(data.entity.name)}</h2>
        <span class="text-sm px-3 py-1.5 rounded-md ${colors.tag} font-mono">${escapeHtml(data.entity.tech)}</span>
      </div>
      <p class="text-lg font-semibold ${colors.role} mb-4">${escapeHtml(data.entity.role)}</p>
      <p class="text-base text-muted-foreground leading-relaxed mb-6">${escapeHtml(data.entity.description)}</p>
${subSections}
    </div>
  </div>
</section>`;
}
