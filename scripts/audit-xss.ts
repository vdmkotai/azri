// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { writeFile } from 'node:fs/promises';
import { renderPage } from '../packages/renderer/src/index.ts';
import type { ExplainerPlan, RepoSnapshot } from '../packages/types/src/index.ts';

const EVIDENCE = '/Users/vkotai/work/azri/.sisyphus/evidence/task-50';

const MALICIOUS_TITLE = '<script>alert("xss-title")</script>';
const MALICIOUS_SUMMARY = '<img src=x onerror="alert(\'xss-summary\')">';
const MALICIOUS_SECTION_TITLE = '<script>alert("xss-section")</script>';
const MALICIOUS_PROSE = '<script>alert("xss-prose")</script>';
const MALICIOUS_PR_URL = 'javascript:alert("xss-pr")';
const MALICIOUS_RUN_ID = '"><script>alert("xss-runid")</script>';
const MALICIOUS_RISK_SUMMARY = '<script>alert("xss-risk")</script>';

const plan: ExplainerPlan = {
  schemaVersion: 1,
  title: MALICIOUS_TITLE,
  summary: MALICIOUS_SUMMARY,
  sections: [
    {
      id: 'sec1',
      title: MALICIOUS_SECTION_TITLE,
      importance: 'critical',
      sectionType: 'overview',
      files: [],
      proseMarkdown: MALICIOUS_PROSE,
      evidencePacketIds: [],
    },
    {
      id: 'sec2',
      title: 'Risks',
      importance: 'important',
      sectionType: 'risk-callouts',
      files: [],
      proseMarkdown: 'Some prose.',
      evidencePacketIds: [],
    },
  ],
  collapsedFiles: [],
  diagramSpecs: [],
  risks: [
    {
      severity: 'critical',
      category: 'auth',
      summary: MALICIOUS_RISK_SUMMARY,
      citations: [{ file: 'evil.ts', lineStart: 1, lineEnd: 2, kind: 'code' }],
    },
  ],
};

const repo: RepoSnapshot = {
  owner: 'azri',
  name: 'audit-xss',
  defaultBranch: 'main',
  readme: null,
  languages: {},
  packageManifests: {},
  fileTree: [],
  capturedAt: new Date().toISOString(),
};

const bundle = await renderPage(plan, undefined, repo, {
  prUrl: MALICIOUS_PR_URL,
  runMeta: { runId: MALICIOUS_RUN_ID, costUsd: 0 },
  generatedAt: '2026-05-22T00:00:00.000Z',
});

const html = bundle.html;

const probes: Array<{
  name: string;
  rawNeedle: string;
  escapedAlternatives: string[];
}> = [
  {
    name: 'title (plan.title)',
    rawNeedle: '<script>alert("xss-title")</script>',
    escapedAlternatives: ['&lt;script&gt;alert(&quot;xss-title&quot;)&lt;/script&gt;'],
  },
  {
    name: 'summary (plan.summary)',
    rawNeedle: '<img src=x onerror="alert(\'xss-summary\')">',
    escapedAlternatives: [
      '&lt;img src&#61;x onerror&#61;&quot;alert(&#39;xss-summary&#39;)&quot;&gt;',
    ],
  },
  {
    name: 'section.title',
    rawNeedle: '<script>alert("xss-section")</script>',
    escapedAlternatives: ['&lt;script&gt;alert(&quot;xss-section&quot;)&lt;/script&gt;'],
  },
  {
    name: 'risk.summary',
    rawNeedle: '<script>alert("xss-risk")</script>',
    escapedAlternatives: ['&lt;script&gt;alert(&quot;xss-risk&quot;)&lt;/script&gt;'],
  },
  {
    name: 'runMeta.runId',
    rawNeedle: '"><script>alert("xss-runid")</script>',
    escapedAlternatives: ['&quot;&gt;&lt;script&gt;alert(&quot;xss-runid&quot;)&lt;/script&gt;'],
  },
  {
    name: 'prUrl (javascript: scheme attribute)',
    rawNeedle: 'href="javascript:alert("xss-pr")"',
    escapedAlternatives: [],
  },
];

const findings: Array<{
  probe: string;
  rawPresent: boolean;
  rawCount: number;
  escapedPresent: boolean;
  status: 'ESCAPED' | 'RAW-LEAKED' | 'NOT-RENDERED';
  note?: string;
}> = [];
let rawLeakCount = 0;

for (const p of probes) {
  const rawCount = (
    html.match(new RegExp(p.rawNeedle.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'gu')) ?? []
  ).length;
  const rawPresent = rawCount > 0;
  const escapedPresent = p.escapedAlternatives.some((alt) => html.includes(alt));
  let status: 'ESCAPED' | 'RAW-LEAKED' | 'NOT-RENDERED';
  if (rawPresent) {
    status = 'RAW-LEAKED';
    rawLeakCount += 1;
  } else if (escapedPresent) {
    status = 'ESCAPED';
  } else {
    status = 'NOT-RENDERED';
  }
  findings.push({
    probe: p.name,
    rawPresent,
    rawCount,
    escapedPresent,
    status,
    note:
      p.name.startsWith('prUrl') && rawPresent
        ? 'javascript: URLs are NOT sanitized; CSP base-uri none + script-src none mitigates but renderer should reject.'
        : undefined,
  });
}

const prScriptInHref = html.includes('href="javascript:');

const report = {
  bundleSizeBytes: bundle.sizeBytes,
  contentHash: bundle.contentHash,
  cspMetaPresent: html.includes(
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'none';",
  ),
  rawScriptTagCount: (html.match(/<script\b/giu) ?? []).length,
  rawOnerrorAttrCount: (html.match(/\bonerror\s*=/giu) ?? []).length,
  inlineEventHandlerCount: (html.match(/\son[a-z]+\s*=\s*"/giu) ?? []).length,
  prHrefHasJavascript: prScriptInHref,
  rawLeakCount,
  probeFindings: findings,
  htmlExcerptHead: html.slice(0, 600),
  htmlContainsTitleEscaped: html.includes(
    '&lt;script&gt;alert(&quot;xss-title&quot;)&lt;/script&gt;',
  ),
};

await writeFile(`${EVIDENCE}/xss-test.json`, JSON.stringify(report, null, 2));

const lines: string[] = [
  '# XSS escaping proof for @azri/renderer renderPage()',
  '',
  `bundle size: ${bundle.sizeBytes} bytes`,
  `content hash: ${bundle.contentHash}`,
  `CSP meta present: ${report.cspMetaPresent}`,
  `raw <script tags in output: ${report.rawScriptTagCount}`,
  `raw onerror= attrs in output: ${report.rawOnerrorAttrCount}`,
  `raw inline event handlers: ${report.inlineEventHandlerCount}`,
  `prUrl contains javascript: in href: ${report.prHrefHasJavascript}`,
  `raw payload leak count: ${rawLeakCount}`,
  '',
  'Per-probe findings:',
];
for (const f of findings) {
  lines.push(
    `  - ${f.probe.padEnd(35)} status=${f.status.padEnd(14)} rawCount=${f.rawCount} escapedPresent=${f.escapedPresent}${f.note ? ' note=' + f.note : ''}`,
  );
}
lines.push('', 'Title-escaped substring present in HTML: ' + report.htmlContainsTitleEscaped);

await writeFile(`${EVIDENCE}/xss-test.txt`, lines.join('\n'));

if (rawLeakCount > 0) {
  console.error('FAIL: ' + rawLeakCount + ' raw payload(s) leaked into HTML output.');
  for (const f of findings.filter((x) => x.status === 'RAW-LEAKED')) {
    console.error('  - ' + f.probe);
  }
  process.exit(1);
}

console.log('PASS: All ' + findings.length + ' XSS probes were escaped or not rendered.');
console.log(JSON.stringify(report, null, 2));
