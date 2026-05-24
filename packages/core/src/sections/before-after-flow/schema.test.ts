// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { BeforeAfterFlowDataSchema } from './schema.ts';

const validData = {
  title: 'Request flow',
  beforeMermaid: 'graph LR\n  A-->B',
  afterMermaid: 'graph LR\n  A-->C',
  diffSummary: 'The flow now routes through validation.',
};

describe('before-after-flow schema', () => {
  test('accepts valid data', () => {
    const result = BeforeAfterFlowDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty before diagram', () => {
    const result = BeforeAfterFlowDataSchema.safeParse({
      title: 'Request flow',
      beforeMermaid: '',
      afterMermaid: 'graph LR\n  A-->C',
      diffSummary: 'The flow now routes through validation.',
    });
    expect(result.success).toBe(false);
  });

  test('rejects overlong diff summary', () => {
    const result = BeforeAfterFlowDataSchema.safeParse({
      title: 'Request flow',
      beforeMermaid: 'graph LR\n  A-->B',
      afterMermaid: 'graph LR\n  A-->C',
      diffSummary:
        'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    });
    expect(result.success).toBe(false);
  });
});
