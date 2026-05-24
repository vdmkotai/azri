// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { DataFlowDiagramDataSchema } from './schema.ts';

const validData = {
  title: 'Data flow',
  mermaidSource: 'graph LR\n  A-->B',
  steps: [
    {
      number: 1,
      action: 'Read input',
    },
    {
      number: 2,
      action: 'Plan sections',
    },
    {
      number: 3,
      action: 'Render page',
    },
  ],
  notes: 'The stages stay isolated.',
};

describe('data-flow-diagram schema', () => {
  test('accepts valid data', () => {
    const result = DataFlowDiagramDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects fewer than three steps', () => {
    const result = DataFlowDiagramDataSchema.safeParse({
      title: 'Data flow',
      mermaidSource: 'graph LR\n  A-->B',
      steps: [
        {
          number: 1,
          action: 'Read input',
        },
        {
          number: 2,
          action: 'Plan sections',
        },
      ],
      notes: 'The stages stay isolated.',
    });
    expect(result.success).toBe(false);
  });

  test('rejects step number below one', () => {
    const result = DataFlowDiagramDataSchema.safeParse({
      title: 'Data flow',
      mermaidSource: 'graph LR\n  A-->B',
      steps: [
        {
          number: 0,
          action: 'Read input',
        },
        {
          number: 2,
          action: 'Plan sections',
        },
        {
          number: 3,
          action: 'Render page',
        },
      ],
      notes: 'The stages stay isolated.',
    });
    expect(result.success).toBe(false);
  });
});
