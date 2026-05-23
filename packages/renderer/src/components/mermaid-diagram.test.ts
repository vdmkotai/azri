// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { MermaidDiagram } from './mermaid-diagram.ts';

describe('MermaidDiagram', () => {
  const schema = z.object({
    source: z.string(),
    caption: z.string().optional(),
    ariaLabel: z.string().optional(),
  });

  test('escapes source and caption in text fallback', () => {
    const html = MermaidDiagram({
      source: '<svg onload="x"><script>x</script><circle /></svg>',
      caption: '<b>x</b>',
    });
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('onload=');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
  test('props schema validates component inputs', () =>
    expect(schema.safeParse({ source: 'graph TD; A-->B' }).success).toBe(true));
  test('output snapshot', () =>
    expect(MermaidDiagram({ source: 'graph TD; A-->B', caption: 'Flow' })).toMatchSnapshot());
});
