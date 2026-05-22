// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { DiagramKind, EvidencePacket, Section } from '../../../types/src/index.ts';

const SCHEMA_RE = /schema|migration|database|prisma|drizzle|sql\b|table|column/u;
const API_RE = /api|endpoint|websocket|http|request|response|rpc|protocol/u;
const CLASS_RE = /class|interface|extends|implements|hierarchy|inheritance/u;

export function selectDiagramKind(
  section: Section,
  packets: ReadonlyArray<EvidencePacket>,
): DiagramKind {
  const haystack = (
    section.title +
    ' ' +
    section.files.join(' ') +
    ' ' +
    packets.map((p) => p.summary + ' ' + p.riskSignals.join(' ')).join(' ')
  ).toLowerCase();
  if (SCHEMA_RE.test(haystack)) return 'mermaid-er';
  if (API_RE.test(haystack)) return 'mermaid-sequence';
  if (CLASS_RE.test(haystack)) return 'mermaid-class';
  return 'mermaid-flow';
}
