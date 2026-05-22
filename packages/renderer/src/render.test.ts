// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import type { ExplainerPlan, RepoSnapshot } from '../../types/src/index.ts';
import { renderPage } from './render.ts';

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

function plan(): ExplainerPlan {
  return {
    schemaVersion: 1,
    title: 'Safe page',
    summary: 'No external URLs.',
    sections: [
      {
        id: 'support',
        title: 'Supporting',
        importance: 'supporting',
        sectionType: 'next-steps',
        files: [],
        proseMarkdown: 'Third paragraph.',
        evidencePacketIds: [],
      },
      {
        id: 'critical',
        title: 'Critical',
        importance: 'critical',
        sectionType: 'overview',
        files: [],
        proseMarkdown: 'First paragraph.',
        evidencePacketIds: [],
      },
    ],
    collapsedFiles: [],
    diagramSpecs: [],
    risks: [],
  };
}

describe('renderPage', () => {
  test('is deterministic for the same input and generatedAt', async () => {
    const a = await renderPage(plan(), undefined, repo(), { generatedAt: '2026-05-22T00:00:00Z' });
    const b = await renderPage(plan(), undefined, repo(), { generatedAt: '2026-05-22T00:00:00Z' });
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.html).toBe(b.html);
  });

  test('orders sections by importance', async () => {
    const out = await renderPage(plan(), undefined, repo());
    expect(out.html.indexOf('Critical')).toBeLessThan(out.html.indexOf('Supporting'));
  });

  test('emits CSP meta with script-src none and no script tags', async () => {
    const out = await renderPage(plan(), undefined, repo());
    expect(out.html).toContain("default-src 'self'; script-src 'none'");
    expect(out.html).not.toMatch(/<script\b/iu);
  });

  test('does not emit external anchors or scripts for safe input', async () => {
    const out = await renderPage(plan(), undefined, repo());
    expect(out.html).not.toMatch(/href="https?:\/\//iu);
    expect(out.html).not.toMatch(/src="https?:\/\//iu);
    expect(out.html).not.toContain('<script>');
  });

  test.todo('strips arbitrary external URLs introduced by model-authored markdown');
});
