// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { DimensionScore, SavedRun } from '../types.ts';

export function scoreDepth(run: SavedRun): DimensionScore {
  if (run.output.kind !== 'ok' && run.output.kind !== 'cache-hit') {
    return { score: 1, value: 0, note: `output kind ${run.output.kind}` };
  }
  const sections = run.output.explainerPlan.sections;
  const packetIds = new Set(Object.keys(run.output.evidenceGraph.packets));
  const covered = new Set(sections.flatMap((section) => section.evidencePacketIds));
  const coverage =
    packetIds.size === 0
      ? 0
      : [...packetIds].filter((id) => covered.has(id)).length / packetIds.size;

  if (sections.length >= 6 && coverage >= 1) return { score: 5, value: coverage };
  if (sections.length >= 5 && coverage >= 0.75) return { score: 4, value: coverage };
  if (sections.length >= 3 && coverage >= 0.5) return { score: 3, value: coverage };
  if (sections.length > 2) return { score: 2, value: coverage };
  return { score: 1, value: coverage };
}
