// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { LanguageModel } from 'ai';
import type {
  AzriConfig,
  AzriMode,
  ChangedFile,
  ChangeSet,
  EvidenceGraph,
  ExplainerPlan,
  FileEntry,
  RepoSnapshot,
} from '../../../types/src/index.ts';
import type { ProviderName } from '../providers/registry.ts';

export interface Stage0Logger {
  info(event: string, fields?: Record<string, unknown>): void;
  warn(event: string, fields?: Record<string, unknown>): void;
  debug(event: string, fields?: Record<string, unknown>): void;
}

export interface Stage0Cache {
  /** Returns cached AzriRunOutput JSON if present; undefined otherwise. */
  get(cacheKey: string): Promise<unknown | undefined>;
}

export interface Stage0Deps {
  cache: Stage0Cache;
  logger: Stage0Logger;
  model: string;
}

export type PrClassification =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'docs'
  | 'chore'
  | 'migration'
  | 'repo-overview';

export interface Stage0OkOutput {
  kind: 'ok';
  mode: AzriMode;
  repo: RepoSnapshot;
  change: ChangeSet | undefined;
  classification: PrClassification;
  isFromFork: boolean;
  isBotAuthor: boolean;
  cacheKey: string;
  skippedFiles: ReadonlyArray<{ path: string; reason: string }>;
  /** Only populated in repo mode; empty in PR mode. */
  interestingFiles: ReadonlyArray<FileEntry>;
  /** Files that survived filtering and will be passed to Stage 1. */
  filteredChangedFiles: ReadonlyArray<ChangedFile>;
}

export interface Stage0TooLargeOutput {
  kind: 'too-large';
  stats: { files: number; lines: number; perFileMaxBytes: number };
  cacheKey: string;
}

export interface Stage0CacheHitOutput {
  kind: 'cache-hit';
  cacheKey: string;
  /** Opaque cached AzriRunOutput JSON; orchestrator re-validates. */
  output: unknown;
}

export interface Stage0SkipOutput {
  kind: 'skip';
  reason: 'empty-pr' | 'binary-only' | 'docs-only' | 'bot-author';
  cacheKey: string;
}

export type Stage0Output =
  | Stage0OkOutput
  | Stage0TooLargeOutput
  | Stage0CacheHitOutput
  | Stage0SkipOutput;

export interface Stage1Deps {
  logger: Stage0Logger;
  provider: ProviderName;
  cheapModel: LanguageModel;
  apiKey: string | undefined;
  /** Optional blob cache: file blob SHA → cached EvidencePacket. */
  blobCacheGet?: (blobSha: string) => Promise<unknown>;
  blobCacheSet?: (blobSha: string, packet: unknown) => Promise<void>;
}

export interface Stage1Output {
  evidenceGraph: EvidenceGraph;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  cacheHits: number;
  durationMs: number;
}

export interface Stage3Input {
  mode: AzriMode;
  plan: ExplainerPlan;
  evidenceGraph: EvidenceGraph;
  repo: RepoSnapshot;
  change?: ChangeSet;
  config: AzriConfig;
}

export interface Stage3Deps {
  logger: Stage0Logger;
  provider: ProviderName;
  reasoningModel: LanguageModel;
}

export interface Stage3Output {
  /** ExplainerPlan with proseMarkdown filled on every section. */
  plan: ExplainerPlan;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  perSectionFailures: number;
  durationMs: number;
}

export interface Stage2Deps {
  logger: Stage0Logger;
  provider: ProviderName;
  reasoningModel: LanguageModel;
}

export interface Stage2Output {
  plan: ExplainerPlan;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  retried: boolean;
  fellBackToMinimal: boolean;
  durationMs: number;
}
