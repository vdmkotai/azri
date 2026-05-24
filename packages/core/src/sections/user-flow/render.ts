// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../_shared.ts';
import type { ThemeTokens } from '../types.ts';
import type { UserFlowData, UserFlowStep } from './schema.ts';

function renderStep(step: UserFlowStep, isLast: boolean): string {
  const lineClass = isLast ? '' : 'border-l-2 border-muted/40';
  const padBottom = isLast ? '' : 'pb-10';
  const number = step.number.toString().padStart(2, '0');
  return `      <li class="relative ml-6 pl-10 ${padBottom} ${lineClass}">
        <span class="absolute -left-6 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-bg shadow-card ring-4 ring-bg">${escapeHtml(number)}</span>
        <div class="pt-1">
          <div class="mb-2 flex items-center gap-2">
            <i data-lucide="${escapeHtml(step.icon)}" class="h-5 w-5 shrink-0 text-primary" aria-hidden="true"></i>
            <h3 class="font-display text-xl font-semibold text-foreground">${escapeHtml(step.title)}</h3>
          </div>
          <p class="text-base leading-relaxed text-muted-foreground">${escapeHtml(step.description)}</p>
        </div>
      </li>`;
}

export function renderSection(data: UserFlowData, _themeTokens: ThemeTokens): string {
  const lastIndex = data.steps.length - 1;
  const steps = data.steps.map((step, index) => renderStep(step, index === lastIndex)).join('\n');
  return `<section id="user-flow" class="my-12">
  <div class="mb-8">
    <p class="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-primary">User flow</p>
    <h2 class="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">${escapeHtml(data.title)}</h2>
  </div>
  <ol class="relative">
${steps}
  </ol>
</section>`;
}
