// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { MermaidDiagram } from './mermaid-diagram.ts';

describe('MermaidDiagram', () => {
  const schema = z.object({
    svgString: z.string(),
    caption: z.string().optional(),
    ariaLabel: z.string().optional(),
  });

  test('strips executable SVG tags and event handlers', () => {
    const html = MermaidDiagram({
      svgString: '<svg onload="x"><script>x</script><circle /></svg>',
      caption: '<b>x</b>',
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('onload=');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
  test('props schema validates component inputs', () =>
    expect(schema.safeParse({ svgString: '<svg />' }).success).toBe(true));
  test('output snapshot', () =>
    expect(
      MermaidDiagram({ svgString: '<svg><circle /></svg>', caption: 'Flow' }),
    ).toMatchSnapshot());
});
