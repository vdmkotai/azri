// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { ZodSchema } from 'zod';

import type {
  AzriConfig,
  AzriMode,
  ChangeSet,
  EvidenceGraph,
  RepoSnapshot,
} from '../../../types/src/index.ts';

export interface ThemeTokens {
  readonly name: string;
  readonly themeCss: string;
  readonly swatches: readonly string[];
  readonly description?: string;
}

export interface SectionInput {
  readonly mode: AzriMode;
  readonly repo: RepoSnapshot;
  readonly evidenceGraph: EvidenceGraph;
  readonly config: AzriConfig;
  readonly change?: ChangeSet;
}

export interface SectionOutput<TData = unknown> {
  readonly id: string;
  readonly data: TData;
}

export interface PlannedSection {
  readonly id: string;
  readonly rationale: string;
  readonly position: number;
}

export interface ProducedSection<TData = unknown> {
  readonly id: string;
  readonly rationale: string;
  readonly data: TData;
}

export interface SectionManifestEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly applicableFor: readonly AzriMode[];
}

export interface SectionType<TData> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly applicableFor: readonly AzriMode[];
  readonly schema: ZodSchema<TData>;
  readonly prompt: (input: SectionInput, themeTokens: ThemeTokens) => string;
  readonly render: (data: TData, themeTokens: ThemeTokens) => string;
  readonly cost: { readonly tokensIn: number; readonly tokensOut: number };
}
