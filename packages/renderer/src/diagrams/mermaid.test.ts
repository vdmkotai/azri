// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import packageJson from '../../../../package.json' with { type: 'json' };
import { clearMermaidCache, renderMermaidToSvg } from './mermaid.ts';

describe('renderMermaidToSvg', () => {
  test('returns SVG fallback without throwing when renderer is disabled', async () => {
    process.env['AZRI_DISABLE_MERMAID'] = 'true';
    clearMermaidCache();
    const svg = await renderMermaidToSvg('graph TD; A-->B');
    expect(svg).toContain('<svg');
    expect(svg).toContain('renderer unavailable');
    delete process.env['AZRI_DISABLE_MERMAID'];
  });

  test('escapes bad source in fallback path', async () => {
    process.env['AZRI_DISABLE_MERMAID'] = 'true';
    clearMermaidCache();
    const svg = await renderMermaidToSvg('<script>alert(1)</script>');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    delete process.env['AZRI_DISABLE_MERMAID'];
  });

  test('uses mermaid-isomorphic without a direct Puppeteer dependency', () => {
    expect(packageJson.dependencies['mermaid-isomorphic']).toBeDefined();
    expect('puppeteer' in packageJson.dependencies).toBe(false);
    expect('puppeteer' in packageJson.devDependencies).toBe(false);
  });
});
