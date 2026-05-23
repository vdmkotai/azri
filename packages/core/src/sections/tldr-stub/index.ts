// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

import type { SectionType } from '../types.ts';

export const TldrStubSchema = z.object({
  hook: z.string(),
  description: z.string(),
});

export type TldrStubData = z.infer<typeof TldrStubSchema>;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
}

export const tldrStubSection: SectionType<TldrStubData> = {
  id: 'tldr-stub',
  name: 'TL;DR Stub',
  description: 'Placeholder TL;DR section used until the real Phase 3 TL;DR lands.',
  applicableFor: ['pr', 'repo'],
  schema: TldrStubSchema,
  prompt: () => 'Just produce a stub greeting. Return JSON with hook and description.',
  render: (data) => `<section class="rounded-card bg-surface p-8 shadow-card ring-1 ring-muted/70">
  <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">TL;DR</p>
  <h2 class="font-display text-4xl font-bold tracking-tight text-foreground">${escapeHtml(data.hook)}</h2>
  <p class="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">${escapeHtml(data.description)}</p>
</section>`,
  cost: { tokensIn: 100, tokensOut: 80 },
};
