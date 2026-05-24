// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

/**
 * Regenerate example HTML pages from v3 Section Registry mock inputs.
 *
 * Run with:
 *   bun examples/generate.ts
 *
 * Or to limit to a single example:
 *   bun examples/generate.ts pr-explainer
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as registeredSections from '../packages/core/src/sections/index.ts';
import type { ProducedSection } from '../packages/core/src/sections/types.ts';
import { GALLERY_MOCKS } from '../packages/renderer/scripts/v3-gallery-mocks.ts';
import { PRESET_NAMES } from '../packages/renderer/src/design-system/index.ts';
import { renderPageV3 } from '../packages/renderer/src/v3/render.ts';

void registeredSections;

interface ExampleConfig {
  readonly out: string;
  readonly repo: { owner: string; name: string };
  readonly prUrl?: string;
  readonly generatedAt: string;
  readonly sectionIds: readonly string[];
}

const HERE = dirname(fileURLToPath(import.meta.url));

const CONFIGS: Record<string, ExampleConfig> = {
  'pr-explainer': {
    out: 'pr-explainer.html',
    repo: { owner: 'effect-ts', name: 'effect' },
    prUrl: 'https://github.com/Effect-TS/effect/pull/4821',
    generatedAt: '2026-05-22T10:18:00Z',
    sectionIds: ['pr-tldr', 'change-summary', 'annotated-diff', 'test-impact', 'reviewer-guide'],
  },
  'repo-overview': {
    out: 'repo-overview.html',
    repo: { owner: 'tj', name: 'commander.js' },
    generatedAt: '2026-05-22T10:24:00Z',
    sectionIds: ['tldr', 'project-overview', 'stack-grid', 'key-files', 'directory-tree'],
  },
  'big-pr': {
    out: 'big-pr.html',
    repo: { owner: 'oven-sh', name: 'bun' },
    prUrl: 'https://github.com/oven-sh/bun/pull/14188',
    generatedAt: '2026-05-22T10:31:00Z',
    sectionIds: [
      'tldr',
      'architecture-decision',
      'comparison-table',
      'data-flow-diagram',
      'risk-callout',
      'rollback-plan',
      'verification-checklist',
    ],
  },
};

function sectionsFor(cfg: ExampleConfig): ProducedSection[] {
  return cfg.sectionIds.map((id) => ({
    id,
    rationale: `Example ${id} section generated from v3 mock data.`,
    data: GALLERY_MOCKS[id],
  }));
}

function renderExample(name: string, cfg: ExampleConfig, themeName: string): string {
  return renderPageV3({
    title: `${cfg.repo.owner}/${cfg.repo.name}`,
    themeName,
    sections: sectionsFor(cfg),
    metadata: {
      generatedAt: cfg.generatedAt,
      runId: `example-${name}`,
      repoUrl: `https://github.com/${cfg.repo.owner}/${cfg.repo.name}`,
      ...(cfg.prUrl ? { prUrl: cfg.prUrl } : {}),
    },
  });
}

async function generateOne(name: string, cfg: ExampleConfig): Promise<{ size: number }> {
  const html = renderExample(name, cfg, 'default');
  await writeFile(join(HERE, cfg.out), html, 'utf8');
  return { size: Buffer.byteLength(html, 'utf8') };
}

async function generateThemed(
  name: string,
  cfg: ExampleConfig,
  theme: string,
): Promise<{ size: number; outPath: string }> {
  const html = renderExample(name, cfg, theme);
  const themeDir = join(HERE, 'themes', theme);
  await mkdir(themeDir, { recursive: true });
  const outPath = join(themeDir, cfg.out);
  await writeFile(outPath, html, 'utf8');
  return { size: Buffer.byteLength(html, 'utf8'), outPath };
}

async function main(): Promise<void> {
  const filter = process.argv.slice(2)[0];
  const targets: Array<[string, ExampleConfig]> = filter
    ? CONFIGS[filter]
      ? [[filter, CONFIGS[filter]]]
      : []
    : Object.entries(CONFIGS);

  if (targets.length === 0) {
    const known = Object.keys(CONFIGS).join(', ');
    console.error(`Unknown example: ${filter ?? '(none)'}. Known: ${known}`);
    process.exit(1);
  }

  for (const [name, cfg] of targets) {
    const { size } = await generateOne(name, cfg);
    console.log(`  rendered ${cfg.out.padEnd(24)} (${(size / 1024).toFixed(1)} KB) from v3 mocks`);
  }

  const themeTarget = CONFIGS['pr-explainer'];
  if ((!filter || filter === 'pr-explainer') && themeTarget) {
    for (const theme of PRESET_NAMES) {
      const { size, outPath } = await generateThemed('pr-explainer', themeTarget, theme);
      const rel = outPath.startsWith(HERE) ? outPath.slice(HERE.length + 1) : outPath;
      console.log(`  rendered ${rel.padEnd(40)} (${(size / 1024).toFixed(1)} KB) theme=${theme}`);
    }
  }
}

await main();
