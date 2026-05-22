// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../utils/escape-html.ts';

export interface DiffHunk {
  file: string;
  lines: ReadonlyArray<{ kind: 'add' | 'del' | 'meta' | 'context'; content: string }>;
}

export interface DiffAnnotation {
  file: string;
  line?: number;
  severity: 'info' | 'warn' | 'critical';
  note: string;
}

export interface AnnotatedDiffProps {
  hunks: ReadonlyArray<DiffHunk>;
  annotations?: ReadonlyArray<DiffAnnotation>;
}

export function AnnotatedDiff(p: AnnotatedDiffProps): string {
  const annoByFile = new Map<string, DiffAnnotation[]>();
  for (const a of p.annotations ?? []) {
    const arr = annoByFile.get(a.file) ?? [];
    arr.push(a);
    annoByFile.set(a.file, arr);
  }
  const hunkBlocks = p.hunks
    .map((h) => {
      const annos = (annoByFile.get(h.file) ?? [])
        .map(
          (a) =>
            `<div class="diff-annotation diff-annotation-${a.severity}">${escapeHtml(a.note)}</div>`,
        )
        .join('');
      const lines = h.lines
        .map((l) => `<div class="diff-line diff-line-${l.kind}">${escapeHtml(l.content)}</div>`)
        .join('');
      return `<div class="azri-diff-file"><div class="diff-filename">${escapeHtml(h.file)}</div>${annos}<div class="diff-body">${lines}</div></div>`;
    })
    .join('');
  return `<div class="azri-annotated-diff">${hunkBlocks}</div>`;
}
