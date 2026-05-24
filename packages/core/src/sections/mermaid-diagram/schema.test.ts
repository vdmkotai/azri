// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { MermaidDiagramDataSchema } from './schema.ts';

const validData = {
  title: 'Pipeline diagram',
  source: 'graph LR\n  A[Input]-->B[Output]',
  caption: 'The high-level flow.',
  kind: 'flowchart',
};

describe('mermaid-diagram schema', () => {
  test('accepts valid data', () => {
    const result = MermaidDiagramDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty source', () => {
    const result = MermaidDiagramDataSchema.safeParse({
      title: 'Pipeline diagram',
      source: '',
      caption: 'The high-level flow.',
      kind: 'flowchart',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid kind', () => {
    const result = MermaidDiagramDataSchema.safeParse({
      title: 'Pipeline diagram',
      source: 'graph LR\n  A[Input]-->B[Output]',
      caption: 'The high-level flow.',
      kind: 'pie',
    });
    expect(result.success).toBe(false);
  });
});
