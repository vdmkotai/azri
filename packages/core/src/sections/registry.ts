// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { AzriMode } from '../../../types/src/index.ts';
import { SectionNotFoundError } from './errors.ts';
import { tldrStubSection } from './tldr-stub/index.ts';
import type { SectionManifestEntry, SectionType } from './types.ts';

const sections = new Map<string, SectionType<unknown>>();

export function registerSection<TData>(section: SectionType<TData>): void {
  if (sections.has(section.id)) {
    throw new Error(`Duplicate section id: ${section.id}`);
  }
  sections.set(section.id, section as SectionType<unknown>);
}

export function unregisterSection(id: string): void {
  sections.delete(id);
}

export function getSection(id: string): SectionType<unknown> {
  const section = sections.get(id);
  if (!section) throw new SectionNotFoundError(id);
  return section;
}

export function listSections(mode?: AzriMode): SectionType<unknown>[] {
  const all = Array.from(sections.values());
  if (!mode) return all;
  return all.filter((section) => section.applicableFor.includes(mode));
}

export function getManifest(mode: AzriMode): SectionManifestEntry[] {
  return listSections(mode).map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description,
    applicableFor: section.applicableFor,
  }));
}

registerSection(tldrStubSection);
