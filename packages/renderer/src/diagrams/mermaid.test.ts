// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import packageJson from '../../../../package.json' with { type: 'json' };
import { clearMermaidCache, renderMermaidFallback, renderMermaidToSvg } from './mermaid.ts';

describe('renderMermaidFallback', () => {
  test('returns styled source fallback without throwing', () => {
    clearMermaidCache();
    const html = renderMermaidFallback('graph TD; A-->B');
    expect(html).toContain('azri-mermaid-fallback');
    expect(html).toContain('graph TD; A--&gt;B');
  });

  test('escapes bad source in fallback path', () => {
    clearMermaidCache();
    const html = renderMermaidFallback('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('legacy async renderer returns the same fallback', async () => {
    const html = await renderMermaidToSvg('graph TD; A-->B');
    expect(html).toContain('azri-mermaid-fallback');
  });

  test('uses mermaid-isomorphic without a direct Puppeteer dependency', () => {
    expect(packageJson.dependencies['mermaid-isomorphic']).toBeDefined();
    expect('puppeteer' in packageJson.dependencies).toBe(false);
    expect('puppeteer' in packageJson.devDependencies).toBe(false);
  });
});
