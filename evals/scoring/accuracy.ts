// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { Citation } from '@azri/types';

import type { DimensionScore, SavedRun } from '../types.ts';

export function scoreAccuracy(run: SavedRun): DimensionScore {
  const citations =
    run.output.kind === 'ok' || run.output.kind === 'cache-hit'
      ? run.output.explainerPlan.risks.flatMap((risk) => risk.citations)
      : [];
  if (citations.length === 0) return { score: 1, value: 0, note: 'no stage-5 citations found' };

  const allowed = new Set<string>();
  for (const file of run.input.repo.fileTree) allowed.add(file.path);
  for (const file of run.input.change?.files ?? []) allowed.add(file.path);

  const valid = citations.filter((citation) => validCitation(citation, allowed)).length;
  const passRate = valid / citations.length;
  return { score: Math.floor(1 + 4 * passRate), value: passRate };
}

function validCitation(citation: Citation, allowed: Set<string>): boolean {
  return (
    allowed.has(citation.file) && citation.lineStart >= 1 && citation.lineEnd >= citation.lineStart
  );
}
