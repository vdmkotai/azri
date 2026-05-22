// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export { ENGINE_VERSION, PROMPT_VERSION } from './version.ts';

/** Exactly 7 section types. New types require code changes + plan PR. */
export type SectionType =
  | 'overview'
  | 'narrative'
  | 'annotated-diff'
  | 'module-map'
  | 'risk-callouts'
  | 'test-impact'
  | 'next-steps';

/** Exactly 7 risk categories. */
export type RiskCategory =
  | 'auth'
  | 'schema-migration'
  | 'dependency-change'
  | 'api-contract'
  | 'performance'
  | 'secrets-exposure'
  | 'test-coverage';

/** Severity tiers for risks and callouts. */
export type Severity = 'info' | 'warn' | 'critical';

/** Importance tiers for sections, used to sort and emphasize content. */
export type Importance = 'critical' | 'important' | 'supporting' | 'context';

/** Per-file metadata in a repo tree, used for ranking and display. */
export interface FileEntry {
  path: string;
  sizeBytes: number;
  lineCount: number;
  /** ISO 8601 timestamp from git log; omitted when unavailable. */
  lastModifiedAt?: string;
  /** Commit count in the recent window, used for ranking. */
  lastModifiedCommitsCount?: number;
}

/** Snapshot of repository context captured before running the engine. */
export interface RepoSnapshot {
  owner: string;
  name: string;
  defaultBranch: string;
  readme: string | null;
  /** Language name to byte count. */
  languages: Record<string, number>;
  /** Manifest path to raw content. */
  packageManifests: Record<string, string>;
  fileTree: FileEntry[];
  /** ISO 8601 timestamp for when the snapshot was captured. */
  capturedAt: string;
}

/** On-demand repository content reader used for citation validation. */
export interface RepoContentReader {
  readFile(path: string): Promise<string | null>;
  readLineRange(path: string, start: number, end: number): Promise<string | null>;
}

/** File status in a change set. */
export type FileStatus = 'added' | 'modified' | 'deleted' | 'renamed';

/** A single changed file with patch data and basic change metrics. */
export interface ChangedFile {
  path: string;
  status: FileStatus;
  patch: string;
  additions: number;
  deletions: number;
  isBinary: boolean;
  isGenerated: boolean;
}

/** Minimal commit metadata needed for PR and repo analysis. */
export interface Commit {
  sha: string;
  message: string;
  authorName: string;
  authoredAt: string;
}

/** Pull request metadata used to anchor PR-mode analysis. */
export interface PrMetadata {
  number: number;
  title: string;
  body: string;
  head: { sha: string; repo: { id: number } };
  base: { sha: string; repo: { id: number } };
  user: { type: 'User' | 'Bot' };
}

/** Set of changed files and surrounding PR context passed into the engine. */
export interface ChangeSet {
  baseSha: string;
  headSha: string;
  files: ChangedFile[];
  commits: Commit[];
  prMetadata?: PrMetadata;
}

/** Kind of citation captured for evidence and validation. */
export type CitationKind = 'code' | 'comment' | 'config' | 'test';

/** A line-anchored citation into a file. */
export interface Citation {
  file: string;
  lineStart: number;
  lineEnd: number;
  kind: CitationKind;
}

/** A single evidence packet summarizing one file or focused code region. */
export interface EvidencePacket {
  id: string;
  path: string;
  lineRange?: { start: number; end: number };
  symbols: string[];
  summary: string;
  riskSignals: string[];
  /** Importance score normalized to 0..1. */
  importance: number;
  citations: Citation[];
  /** Set when stage 1 summarization failed for this packet. */
  summarizeError?: string;
}

/** Graph of evidence packets and their citations. */
export interface EvidenceGraph {
  packets: Record<string, EvidencePacket>;
  citations: Citation[];
  /** File path to packet IDs that cite that file. */
  lookupByFile: Record<string, string[]>;
}

/** Mermaid diagram kinds supported by the explainer plan. */
export type DiagramKind = 'mermaid-flow' | 'mermaid-sequence' | 'mermaid-er' | 'mermaid-class';

/** A diagram specification that can be rendered into SVG later. */
export interface DiagramSpec {
  id: string;
  kind: DiagramKind;
  mermaidSource: string;
  /** Pre-rendered SVG output, filled in by later pipeline stages. */
  renderedSvg?: string;
}

/** A content section in the explainer plan. */
export interface Section {
  id: string;
  title: string;
  importance: Importance;
  sectionType: SectionType;
  files: string[];
  proseMarkdown?: string;
  evidencePacketIds: string[];
  diagramId?: string;
}

/** A risk entry with citations supporting the assessment. */
export interface Risk {
  severity: Severity;
  category: RiskCategory;
  summary: string;
  citations: Citation[];
}

/** The structured output of the planning stages, later rendered into HTML. */
export interface ExplainerPlan {
  schemaVersion: 1;
  title: string;
  summary: string;
  sections: Section[];
  collapsedFiles: string[];
  diagramSpecs: DiagramSpec[];
  risks: Risk[];
}

/** Runtime metadata captured for a single Azri run. */
export interface RunMetadata {
  runId: string;
  engineVersion: string;
  promptVersion: string;
  model: string;
  durationMs: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  cacheHit: boolean;
  /** Per-stage durations in milliseconds. */
  stageDurations: Record<string, number>;
}

/** The rendered HTML bundle and its integrity metadata. */
export interface HtmlBundle {
  html: string;
  sizeBytes: number;
  contentHash: string;
}

/** Theme and presentation tokens for HTML rendering. */
export interface DesignTokens {
  colors?: {
    text?: string;
    background?: string;
    accent?: string;
    severity?: { info?: string; warn?: string; critical?: string };
  };
  typefaces?: { serif?: string; mono?: string };
  allowEmoji?: boolean;
}

/** User-facing configuration for engine behavior and rendering. */
export interface AzriConfig {
  modules?: string[];
  excludePaths?: string[];
  maxFiles?: number;
  maxLines?: number;
  selfBootstrap?: boolean;
  telemetry?: boolean;
  tokens?: DesignTokens;
  /** Operational tuning only; mode-based v1 options are forbidden. */
  focusAreas?: string[];
  /** Caps section length to roughly 150 tokens when enabled. */
  brief?: boolean;
}

/** Engine operating mode. */
export type AzriMode = 'pr' | 'repo';

/** Input payload for a single Azri run. */
export interface AzriRunInput {
  mode: AzriMode;
  repo: RepoSnapshot;
  change?: ChangeSet;
  config: AzriConfig;
}

/** Discriminated output for a run, keyed by `kind`. */
export type AzriRunOutput =
  | {
      kind: 'ok';
      htmlBundle: HtmlBundle;
      explainerPlan: ExplainerPlan;
      evidenceGraph: EvidenceGraph;
      metadata: RunMetadata;
    }
  | {
      kind: 'cache-hit';
      htmlBundle: HtmlBundle;
      explainerPlan: ExplainerPlan;
      evidenceGraph: EvidenceGraph;
      metadata: RunMetadata;
    }
  | {
      kind: 'too-large';
      stats: { files: number; lines: number };
      metadata: RunMetadata;
    }
  | {
      kind: 'head-sha-drift';
      detectedHeadSha: string;
      originalHeadSha: string;
      metadata: RunMetadata;
    }
  | {
      kind: 'skip';
      reason: 'empty-pr' | 'binary-only' | 'docs-only' | 'bot-author';
      metadata: RunMetadata;
    }
  | {
      kind: 'failure';
      error: { message: string; stage: string };
      htmlBundle: HtmlBundle;
      metadata: RunMetadata;
    };
