// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { renderPage, type RenderOptions } from '../../../renderer/src/render.ts';
import type {
  ChangeSet,
  ExplainerPlan,
  HtmlBundle,
  RepoSnapshot,
} from '../../../types/src/index.ts';

export interface Stage4Output {
  bundle: HtmlBundle;
  durationMs: number;
}

export async function runStage4(
  plan: ExplainerPlan,
  change: ChangeSet | undefined,
  repo: RepoSnapshot,
  opts: RenderOptions = {},
): Promise<Stage4Output> {
  const t0 = Date.now();
  const bundle = await renderPage(plan, change, repo, opts);
  return { bundle, durationMs: Date.now() - t0 };
}
