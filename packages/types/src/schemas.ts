// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { z } from 'zod';

import type { AzriConfig } from './index.ts';
import { DesignTokensSchema, UserTokensSchema } from './tokens-schema.ts';

export { DesignTokensSchema, UserTokensSchema };

export const SectionTypeSchema = z.enum([
  'overview',
  'narrative',
  'annotated-diff',
  'module-map',
  'risk-callouts',
  'test-impact',
  'next-steps',
]);

export const RiskCategorySchema = z.enum([
  'auth',
  'schema-migration',
  'dependency-change',
  'api-contract',
  'performance',
  'secrets-exposure',
  'test-coverage',
]);

export const SeveritySchema = z.enum(['info', 'warn', 'critical']);
export const ImportanceSchema = z.enum(['critical', 'important', 'supporting', 'context']);
export const CitationKindSchema = z.enum(['code', 'comment', 'config', 'test']);
export const FileStatusSchema = z.enum(['added', 'modified', 'deleted', 'renamed']);
export const DiagramKindSchema = z.enum([
  'mermaid-flow',
  'mermaid-sequence',
  'mermaid-er',
  'mermaid-class',
]);
export const AzriModeSchema = z.enum(['pr', 'repo']);

export const FileEntrySchema = z.object({
  path: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  lineCount: z.number().int().nonnegative(),
  lastModifiedAt: z.string().optional(),
  lastModifiedCommitsCount: z.number().int().nonnegative().optional(),
});

export const RepoSnapshotSchema = z.object({
  owner: z.string(),
  name: z.string(),
  defaultBranch: z.string(),
  readme: z.string().nullable(),
  languages: z.record(z.number()),
  packageManifests: z.record(z.string()),
  fileTree: z.array(FileEntrySchema),
  capturedAt: z.string(),
});

export const ChangedFileSchema = z.object({
  path: z.string(),
  status: FileStatusSchema,
  patch: z.string(),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  isBinary: z.boolean(),
  isGenerated: z.boolean(),
});

export const CommitSchema = z.object({
  sha: z.string(),
  message: z.string(),
  authorName: z.string(),
  authoredAt: z.string(),
});

export const PrMetadataSchema = z.object({
  number: z.number().int(),
  title: z.string(),
  body: z.string(),
  head: z.object({ sha: z.string(), repo: z.object({ id: z.number().int() }) }),
  base: z.object({ sha: z.string(), repo: z.object({ id: z.number().int() }) }),
  user: z.object({ type: z.enum(['User', 'Bot']) }),
});

export const ChangeSetSchema = z.object({
  baseSha: z.string(),
  headSha: z.string(),
  files: z.array(ChangedFileSchema),
  commits: z.array(CommitSchema),
  prMetadata: PrMetadataSchema.optional(),
});

export const CitationSchema = z.object({
  file: z.string(),
  lineStart: z.number().int().nonnegative(),
  lineEnd: z.number().int().nonnegative(),
  kind: CitationKindSchema,
});

export const EvidencePacketSchema = z.object({
  id: z.string(),
  path: z.string(),
  lineRange: z.object({ start: z.number().int(), end: z.number().int() }).optional(),
  symbols: z.array(z.string()).default([]),
  summary: z.string(),
  riskSignals: z.array(z.string()).default([]),
  importance: z.number().min(0).max(1),
  citations: z.array(CitationSchema).default([]),
  summarizeError: z.string().optional(),
});

export const EvidenceGraphSchema = z.object({
  packets: z.record(EvidencePacketSchema),
  citations: z.array(CitationSchema),
  lookupByFile: z.record(z.array(z.string())),
});

export const DiagramSpecSchema = z.object({
  id: z.string(),
  kind: DiagramKindSchema,
  mermaidSource: z.string(),
  renderedSvg: z.string().optional(),
});

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  importance: ImportanceSchema,
  sectionType: SectionTypeSchema,
  files: z.array(z.string()).default([]),
  proseMarkdown: z.string().optional(),
  evidencePacketIds: z.array(z.string()).default([]),
  diagramId: z.string().optional(),
});

export const RiskSchema = z.object({
  severity: SeveritySchema,
  category: RiskCategorySchema,
  summary: z.string(),
  citations: z.array(CitationSchema).default([]),
});

export const ExplainerPlanSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string(),
  summary: z.string(),
  sections: z.array(SectionSchema).default([]),
  collapsedFiles: z.array(z.string()).default([]),
  diagramSpecs: z.array(DiagramSpecSchema).default([]),
  risks: z.array(RiskSchema).default([]),
});

export const HtmlBundleSchema = z.object({
  html: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  contentHash: z.string(),
});

export const RunMetadataSchema = z.object({
  runId: z.string(),
  engineVersion: z.string(),
  promptVersion: z.string(),
  model: z.string(),
  durationMs: z.number().int().nonnegative(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
  cacheHit: z.boolean(),
  stageDurations: z.record(z.number().nonnegative()),
});

export const VerbositySchema = z.enum(['concise', 'standard', 'detailed']);

export const AzriConfigSchema = z.object({
  modules: z.array(z.string()).default([]),
  excludePaths: z.array(z.string()).default([]),
  maxFiles: z.number().int().positive().default(200),
  maxLines: z.number().int().positive().default(10000),
  selfBootstrap: z.boolean().default(false),
  telemetry: z.boolean().default(false),
  tokens: DesignTokensSchema.optional(),
  theme: z.string().optional(),
  focusAreas: z.array(z.string()).default([]),
  brief: z.boolean().default(false),
  verbosity: VerbositySchema.optional(),
});

const OkRunOutputSchema = z.object({
  kind: z.literal('ok'),
  htmlBundle: HtmlBundleSchema,
  explainerPlan: ExplainerPlanSchema,
  evidenceGraph: EvidenceGraphSchema,
  metadata: RunMetadataSchema,
});

const CacheHitRunOutputSchema = z.object({
  kind: z.literal('cache-hit'),
  htmlBundle: HtmlBundleSchema,
  explainerPlan: ExplainerPlanSchema,
  evidenceGraph: EvidenceGraphSchema,
  metadata: RunMetadataSchema,
});

const TooLargeRunOutputSchema = z.object({
  kind: z.literal('too-large'),
  stats: z.object({ files: z.number().int().nonnegative(), lines: z.number().int().nonnegative() }),
  metadata: RunMetadataSchema,
});

const HeadShaDriftRunOutputSchema = z.object({
  kind: z.literal('head-sha-drift'),
  detectedHeadSha: z.string(),
  originalHeadSha: z.string(),
  metadata: RunMetadataSchema,
});

const SkipRunOutputSchema = z.object({
  kind: z.literal('skip'),
  reason: z.enum(['empty-pr', 'binary-only', 'docs-only', 'bot-author']),
  metadata: RunMetadataSchema,
});

const FailureRunOutputSchema = z.object({
  kind: z.literal('failure'),
  error: z.object({ message: z.string(), stage: z.string() }),
  htmlBundle: HtmlBundleSchema,
  metadata: RunMetadataSchema,
});

export const AzriRunOutputSchema = z.discriminatedUnion('kind', [
  OkRunOutputSchema,
  CacheHitRunOutputSchema,
  TooLargeRunOutputSchema,
  HeadShaDriftRunOutputSchema,
  SkipRunOutputSchema,
  FailureRunOutputSchema,
]);

export const AzriRunInputSchema = z.object({
  mode: AzriModeSchema,
  repo: RepoSnapshotSchema,
  change: ChangeSetSchema.optional(),
  config: AzriConfigSchema,
});

export function validateAzriConfig(input: unknown): AzriConfig {
  const result = AzriConfigSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid AzriConfig:\n${issues}`);
  }

  return result.data as AzriConfig;
}
