// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import type { ExplainerPlan, HtmlBundle, RepoSnapshot } from '../../../types/src/index.ts';
import { silentLogger } from './_test-fixtures.ts';
import { runStage5 } from './stage-5-validate.ts';

function repo(): RepoSnapshot {
  return {
    owner: 'acme',
    name: 'widgets',
    defaultBranch: 'main',
    readme: null,
    languages: {},
    packageManifests: {},
    fileTree: [{ path: 'src/real.ts', sizeBytes: 100, lineCount: 20 }],
    capturedAt: '2026-05-22T00:00:00Z',
  };
}

function bundle(
  html = '<!DOCTYPE html><meta http-equiv="Content-Security-Policy" content="x">',
): HtmlBundle {
  return { html, sizeBytes: Buffer.byteLength(html, 'utf8'), contentHash: 'h' };
}

function plan(file = 'src/real.ts', lineStart = 1, lineEnd = 2): ExplainerPlan {
  return {
    schemaVersion: 1,
    title: 'P',
    summary: 'S',
    sections: [],
    collapsedFiles: [],
    diagramSpecs: [],
    risks: [
      {
        severity: 'warn',
        category: 'api-contract',
        summary: 'Risk.',
        citations: [{ file, lineStart, lineEnd, kind: 'code' }],
      },
    ],
  };
}

describe('runStage5 — validation', () => {
  test('detects hallucinated file paths', async () => {
    const out = await runStage5(
      bundle(),
      plan('src/missing.ts'),
      { mode: 'repo', repo: repo() },
      { logger: silentLogger },
    );
    expect(out.citationsHallucinated).toBe(1);
    expect(out.warnings.join('\n')).toContain('hallucinated file');
  });

  test('detects invalid line ranges', async () => {
    const out = await runStage5(
      bundle(),
      plan('src/real.ts', 10, 3),
      { mode: 'repo', repo: repo() },
      { logger: silentLogger },
    );
    expect(out.citationsHallucinated).toBe(1);
    expect(out.warnings.join('\n')).toContain('invalid lineRange');
  });

  test('detects HTML structural and CSP errors', async () => {
    const out = await runStage5(
      { html: '<html><script src="https://x"></script>', sizeBytes: 42, contentHash: 'h' },
      plan(),
      { mode: 'repo', repo: repo() },
      { logger: silentLogger },
    );
    expect(out.warnings).toContain('Missing Content-Security-Policy meta tag.');
    expect(out.warnings).toContain('Missing <!DOCTYPE html>.');
    expect(out.warnings.join('\n')).toContain('external <script src=>');
  });

  test('detects page-size cap currently enforced by implementation', async () => {
    const html = '<!DOCTYPE html>' + 'x'.repeat(2 * 1024 * 1024 + 1);
    const out = await runStage5(
      { html, sizeBytes: html.length, contentHash: 'h' },
      plan(),
      { mode: 'repo', repo: repo() },
      { logger: silentLogger },
    );
    expect(out.warnings.join('\n')).toContain('exceeds 2MB cap');
  });

  test('all adversarial planted citation hallucination fixtures are detected', async () => {
    const names = [
      'wrong-file',
      'fake-function',
      'bad-line-range',
      'mismatched-lines',
      'script-injection',
      'path-traversal',
      'csp-bypass-attempt',
      'unicode-spoof-path',
      'over-cap-size',
      'external-url-leak',
    ];
    for (const name of names) {
      const fixture = (await import(`../../../../test/fixtures/adversarial/${name}.json`, {
        with: { type: 'json' },
      })) as { default: { file: string; lineStart: number; lineEnd: number } };
      const out = await runStage5(
        bundle(),
        plan(fixture.default.file, fixture.default.lineStart, fixture.default.lineEnd),
        { mode: 'repo', repo: repo() },
        { logger: silentLogger },
      );
      expect(out.citationsHallucinated, name).toBeGreaterThan(0);
    }
  });

  test.todo('detects hallucinated function names inside cited real files');
  test.todo('enforces the spec hard page cap of 1.5 MB instead of current 2 MB cap');
});
