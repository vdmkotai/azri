// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import type { ExplainerPlan, RepoSnapshot } from '../../types/src/index.ts';
import {
  applyDesignTokens,
  PRESETS,
  PRESET_NAMES,
  resolveTheme,
  tokenCss,
} from '../src/design-system/index.ts';
import { renderPage } from '../src/render.ts';

const EXPECTED_PRESETS = ['default', 'github-dark', 'vscode-modern', 'sepia', 'brutalist'];

function plan(): ExplainerPlan {
  return {
    schemaVersion: 1,
    title: 'Themed page',
    summary: 'Sample summary for theme rendering checks.',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        importance: 'critical',
        sectionType: 'overview',
        files: [],
        proseMarkdown: 'A single line of prose.',
        evidencePacketIds: [],
      },
    ],
    collapsedFiles: [],
    diagramSpecs: [],
    risks: [],
  };
}

function repo(): RepoSnapshot {
  return {
    owner: 'acme',
    name: 'widgets',
    defaultBranch: 'main',
    readme: null,
    languages: {},
    packageManifests: {},
    fileTree: [],
    capturedAt: '2026-05-22T00:00:00Z',
  };
}

describe('PRESETS registry', () => {
  test('exports all five expected presets', () => {
    expect([...PRESET_NAMES].toSorted()).toEqual([...EXPECTED_PRESETS].toSorted());
    for (const name of EXPECTED_PRESETS) {
      expect(PRESETS[name]).toBeDefined();
    }
  });

  test('resolveTheme(undefined) returns the default preset', () => {
    expect(resolveTheme()).toBe(PRESETS['default']);
    expect(resolveTheme('default')).toBe(PRESETS['default']);
  });

  test('resolveTheme throws for unknown names', () => {
    expect(() => resolveTheme('nope')).toThrowError(/unknown theme 'nope'/u);
  });
});

describe('preset rendering', () => {
  test.each(EXPECTED_PRESETS)('preset %s renders without throwing', async (name) => {
    const bundle = await renderPage(plan(), undefined, repo(), {
      theme: name,
      generatedAt: '2026-05-22T00:00:00Z',
    });
    expect(bundle.html.length).toBeGreaterThan(0);
    expect(bundle.html).toContain('<!DOCTYPE html>');
    expect(bundle.html).toContain("default-src 'self'; script-src 'none'");
  });

  test('github-dark preset embeds its accent color as a CSS variable', async () => {
    const bundle = await renderPage(plan(), undefined, repo(), {
      theme: 'github-dark',
      generatedAt: '2026-05-22T00:00:00Z',
    });
    expect(bundle.html).toContain('--color-accent:#58a6ff');
  });

  test('sepia preset embeds its accent color as a CSS variable', async () => {
    const bundle = await renderPage(plan(), undefined, repo(), {
      theme: 'sepia',
      generatedAt: '2026-05-22T00:00:00Z',
    });
    expect(bundle.html).toContain('--color-accent:#8b1a1a');
  });

  test('brutalist preset zeroes out radii and shadows', async () => {
    const bundle = await renderPage(plan(), undefined, repo(), {
      theme: 'brutalist',
      generatedAt: '2026-05-22T00:00:00Z',
    });
    expect(bundle.html).toContain('--radius-sm:0px');
    expect(bundle.html).toContain('--radius-md:0px');
    expect(bundle.html).toContain('--radius-lg:0px');
    expect(bundle.html).toContain('--shadow-subtle:none');
    expect(bundle.html).toContain('--shadow-lifted:none');
  });

  test('vscode-modern preset uses denser spacing', async () => {
    const bundle = await renderPage(plan(), undefined, repo(), {
      theme: 'vscode-modern',
      generatedAt: '2026-05-22T00:00:00Z',
    });
    expect(bundle.html).toContain('--space-xs:3px');
    expect(bundle.html).toContain('--space-md:10px');
  });

  test('default preset and undefined theme produce identical output', async () => {
    const withoutTheme = await renderPage(plan(), undefined, repo(), {
      generatedAt: '2026-05-22T00:00:00Z',
    });
    const withDefault = await renderPage(plan(), undefined, repo(), {
      theme: 'default',
      generatedAt: '2026-05-22T00:00:00Z',
    });
    expect(withoutTheme.html).toBe(withDefault.html);
    expect(withoutTheme.contentHash).toBe(withDefault.contentHash);
  });
});

describe('user token override', () => {
  test('user colors override the preset accent in :root', async () => {
    const bundle = await renderPage(plan(), undefined, repo(), {
      theme: 'github-dark',
      tokens: { colors: { accent: '#ff00aa' } },
      generatedAt: '2026-05-22T00:00:00Z',
    });
    const rootBlock = bundle.html.split('@media (prefers-color-scheme:dark)')[0]!;
    expect(rootBlock).toContain('--color-accent:#ff00aa');
    expect(rootBlock).not.toContain('--color-accent:#58a6ff');
  });

  test('user spacing override wins over preset spacing', async () => {
    const merged = applyDesignTokens({ spacing: { xs: 99 } }, resolveTheme('vscode-modern'));
    expect(merged.spacing.xs).toBe(99);
    expect(merged.spacing.md).toBe(10);
  });

  test('user bgCode override flows into rendered CSS variables', async () => {
    const bundle = await renderPage(plan(), undefined, repo(), {
      tokens: { colors: { bgCode: { background: '#101010', text: '#fefefe' } } },
      generatedAt: '2026-05-22T00:00:00Z',
    });
    expect(bundle.html).toContain('--color-bg-code-background:#101010');
    expect(bundle.html).toContain('--color-bg-code-text:#fefefe');
  });

  test('applyDesignTokens with no user input returns the base preset unchanged', () => {
    const base = resolveTheme('sepia');
    expect(applyDesignTokens(undefined, base)).toBe(base);
  });
});

describe('tokenCss for presets', () => {
  test.each(EXPECTED_PRESETS)('emits all required CSS variables for preset %s', (name) => {
    const css = tokenCss(PRESETS[name]!);
    expect(css).toContain('--color-text:');
    expect(css).toContain('--color-bg:');
    expect(css).toContain('--color-accent:');
    expect(css).toContain('--severity-info:');
    expect(css).toContain('--severity-warn:');
    expect(css).toContain('--severity-critical:');
    expect(css).toContain('--color-bg-code-background:');
    expect(css).toContain('--color-bg-code-text:');
    expect(css).toContain('--typeface-serif:');
    expect(css).toContain('--typeface-mono:');
    expect(css).toContain('--space-xs:');
    expect(css).toContain('--radius-sm:');
    expect(css).toContain('--shadow-subtle:');
  });
});
