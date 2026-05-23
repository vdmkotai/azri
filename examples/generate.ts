// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

/**
 * Regenerate the example HTML pages from their hand-authored ExplainerPlan inputs.
 *
 * Run with:
 *   bun examples/generate.ts
 *
 * Or to limit to a single example:
 *   bun examples/generate.ts pr-explainer
 *
 * Each plan file is validated against the public Zod schema before rendering, so
 * the examples are guaranteed to round-trip through the same path the engine
 * uses at runtime.
 *
 * In addition to the top-level examples, this script renders one themed copy of
 * `pr-explainer` per preset in `examples/themes/<preset>/pr-explainer.html`.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRESET_NAMES } from '../packages/renderer/src/design-system/index.ts';
import { renderPage } from '../packages/renderer/src/render.ts';
import {
  ExplainerPlanSchema,
  type ExplainerPlan,
  type RepoSnapshot,
} from '../packages/types/src/index.ts';

interface ExampleConfig {
  readonly plan: string;
  readonly out: string;
  readonly repo: { owner: string; name: string };
  readonly prUrl?: string;
  readonly githubBaseUrl: string;
  readonly generatedAt: string;
}

const HERE = dirname(fileURLToPath(import.meta.url));

const CONFIGS: Record<string, ExampleConfig> = {
  'pr-explainer': {
    plan: 'pr-explainer.plan.json',
    out: 'pr-explainer.html',
    repo: { owner: 'effect-ts', name: 'effect' },
    prUrl: 'https://github.com/Effect-TS/effect/pull/4821',
    githubBaseUrl: 'https://github.com/Effect-TS/effect/blob/eb19a72',
    generatedAt: '2026-05-22T10:18:00Z',
  },
  'repo-overview': {
    plan: 'repo-overview.plan.json',
    out: 'repo-overview.html',
    repo: { owner: 'tj', name: 'commander.js' },
    githubBaseUrl: 'https://github.com/tj/commander.js/blob/v12.1.0',
    generatedAt: '2026-05-22T10:24:00Z',
  },
  'big-pr': {
    plan: 'big-pr.plan.json',
    out: 'big-pr.html',
    repo: { owner: 'oven-sh', name: 'bun' },
    prUrl: 'https://github.com/oven-sh/bun/pull/14188',
    githubBaseUrl: 'https://github.com/oven-sh/bun/blob/24f5a4f',
    generatedAt: '2026-05-22T10:31:00Z',
  },
};

function repoSnapshotFor(owner: string, name: string, capturedAt: string): RepoSnapshot {
  return {
    owner,
    name,
    defaultBranch: 'main',
    readme: null,
    languages: {},
    packageManifests: {},
    fileTree: [],
    capturedAt,
  };
}

async function loadPlan(file: string): Promise<ExplainerPlan> {
  const raw = await readFile(join(HERE, file), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  const result = ExplainerPlanSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Plan ${file} failed schema validation:\n${issues}`);
  }
  return result.data as ExplainerPlan;
}

async function tryReadSvg(name: string, diagramId: string): Promise<string | null> {
  try {
    return await readFile(join(HERE, `${name}.${diagramId}.svg`), 'utf8');
  } catch {
    return null;
  }
}

async function hydratePlan(name: string, plan: ExplainerPlan): Promise<ExplainerPlan> {
  const hydratedSpecs = await Promise.all(
    plan.diagramSpecs.map(async (spec) => {
      if (spec.renderedSvg) return spec;
      const svg = await tryReadSvg(name, spec.id);
      return svg ? { ...spec, renderedSvg: svg } : spec;
    }),
  );
  return { ...plan, diagramSpecs: hydratedSpecs };
}

async function generateOne(name: string, cfg: ExampleConfig): Promise<{ size: number }> {
  const plan = await hydratePlan(name, await loadPlan(cfg.plan));
  const repo = repoSnapshotFor(cfg.repo.owner, cfg.repo.name, cfg.generatedAt);
  const bundle = await renderPage(plan, undefined, repo, {
    generatedAt: cfg.generatedAt,
    githubBaseUrl: cfg.githubBaseUrl,
    runMeta: {
      runId: `example-${name}`,
    },
    ...(cfg.prUrl ? { prUrl: cfg.prUrl } : {}),
  });
  const outPath = join(HERE, cfg.out);
  await writeFile(outPath, bundle.html, 'utf8');
  return { size: bundle.sizeBytes };
}

async function generateThemed(
  name: string,
  cfg: ExampleConfig,
  theme: string,
): Promise<{ size: number; outPath: string }> {
  const plan = await hydratePlan(name, await loadPlan(cfg.plan));
  const repo = repoSnapshotFor(cfg.repo.owner, cfg.repo.name, cfg.generatedAt);
  const bundle = await renderPage(plan, undefined, repo, {
    generatedAt: cfg.generatedAt,
    githubBaseUrl: cfg.githubBaseUrl,
    runMeta: {
      runId: `example-${name}`,
    },
    theme,
    ...(cfg.prUrl ? { prUrl: cfg.prUrl } : {}),
  });
  const themeDir = join(HERE, 'themes', theme);
  await mkdir(themeDir, { recursive: true });
  const outPath = join(themeDir, cfg.out);
  await writeFile(outPath, bundle.html, 'utf8');
  return { size: bundle.sizeBytes, outPath };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const filter = argv[0];

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

  const present = new Set(await readdir(HERE));
  for (const [, cfg] of targets) {
    if (!present.has(cfg.plan)) {
      console.error(`Missing plan file: ${cfg.plan}`);
      process.exit(1);
    }
  }

  for (const [name, cfg] of targets) {
    const { size } = await generateOne(name, cfg);
    const kb = (size / 1024).toFixed(1);
    console.log(`  rendered ${cfg.out.padEnd(24)} (${kb} KB) from ${cfg.plan}`);
  }

  const themeTarget = CONFIGS['pr-explainer'];
  if (!filter || filter === 'pr-explainer') {
    if (!themeTarget) {
      console.error('pr-explainer config missing — cannot render themed variants');
      process.exit(1);
    }
    for (const theme of PRESET_NAMES) {
      const { size, outPath } = await generateThemed('pr-explainer', themeTarget, theme);
      const kb = (size / 1024).toFixed(1);
      const rel = outPath.startsWith(HERE) ? outPath.slice(HERE.length + 1) : outPath;
      console.log(`  rendered ${rel.padEnd(40)} (${kb} KB) theme=${theme}`);
    }
  }
}

await main();
