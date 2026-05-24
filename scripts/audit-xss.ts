// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { writeFile } from 'node:fs/promises';

import * as registeredSections from '../packages/core/src/sections/index.ts';
import type { ProducedSection } from '../packages/core/src/sections/types.ts';
import { renderPageV3 } from '../packages/renderer/src/index.ts';

void registeredSections;

const EVIDENCE = '/Users/vkotai/work/azri/.sisyphus/evidence/task-50';

const MALICIOUS_TITLE = '<script>alert("xss-title")</script>';
const MALICIOUS_DESCRIPTION = '<img src=x onerror="alert(\'xss-summary\')">';
const MALICIOUS_PR_URL = 'javascript:alert("xss-pr")';
const MALICIOUS_RUN_ID = '"><script>alert("xss-runid")</script>';
const MALICIOUS_STAT = '<script>alert("xss-stat")</script>';

const sections: ProducedSection[] = [
  {
    id: 'tldr',
    rationale: 'xss audit',
    data: {
      hook: MALICIOUS_TITLE,
      description: MALICIOUS_DESCRIPTION,
      stats: [{ label: 'Probe', value: MALICIOUS_STAT }],
    },
  },
];

const html = renderPageV3({
  title: MALICIOUS_TITLE,
  themeName: 'default',
  sections,
  metadata: {
    generatedAt: '2026-05-22T00:00:00.000Z',
    runId: MALICIOUS_RUN_ID,
    repoUrl: 'https://github.com/azri/audit-xss',
    prUrl: MALICIOUS_PR_URL,
  },
});

const probes = [
  {
    name: 'title',
    rawNeedle: MALICIOUS_TITLE,
    escapedAlternatives: ['&lt;script&gt;alert(&quot;xss-title&quot;)&lt;/script&gt;'],
  },
  {
    name: 'description',
    rawNeedle: MALICIOUS_DESCRIPTION,
    escapedAlternatives: [
      '&lt;img src=x onerror=&quot;alert(&#39;xss-summary&#39;)&quot;&gt;',
      "&lt;img src=x onerror=&quot;alert('xss-summary')&quot;&gt;",
    ],
  },
  {
    name: 'stat.value',
    rawNeedle: MALICIOUS_STAT,
    escapedAlternatives: ['&lt;script&gt;alert(&quot;xss-stat&quot;)&lt;/script&gt;'],
  },
  {
    name: 'runId',
    rawNeedle: MALICIOUS_RUN_ID,
    escapedAlternatives: ['&quot;&gt;&lt;script&gt;alert(&quot;xss-runid&quot;)&lt;/script&gt;'],
  },
] as const;

const findings = probes.map((probe) => {
  const rawCount = (
    html.match(new RegExp(probe.rawNeedle.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'gu')) ?? []
  ).length;
  const rawPresent = rawCount > 0;
  const escapedPresent = probe.escapedAlternatives.some((alt) => html.includes(alt));
  return {
    probe: probe.name,
    rawPresent,
    rawCount,
    escapedPresent,
    status: rawPresent ? 'RAW-LEAKED' : escapedPresent ? 'ESCAPED' : 'NOT-RENDERED',
  };
});

const rawLeakCount = findings.filter((finding) => finding.rawPresent).length;
const report = {
  bundleSizeBytes: Buffer.byteLength(html, 'utf8'),
  cspMetaPresent: html.includes("default-src 'none'; script-src https://cdn.jsdelivr.net"),
  rawScriptPayloadCount: probes.filter((probe) => html.includes(probe.rawNeedle)).length,
  rawOnerrorAttrCount: (html.match(/\bonerror\s*=/giu) ?? []).length,
  prUrlContainsJavascript: html.includes('javascript:alert'),
  rawLeakCount,
  probeFindings: findings,
  htmlExcerptHead: html.slice(0, 600),
};

await writeFile(`${EVIDENCE}/xss-test.json`, JSON.stringify(report, null, 2));

const lines = [
  '# XSS escaping proof for @azri/renderer renderPageV3()',
  '',
  `bundle size: ${report.bundleSizeBytes} bytes`,
  `CSP meta present: ${report.cspMetaPresent}`,
  `raw payload leak count: ${rawLeakCount}`,
  '',
  'Per-probe findings:',
  ...findings.map(
    (finding) =>
      `  - ${finding.probe.padEnd(20)} status=${finding.status.padEnd(14)} rawCount=${finding.rawCount} escapedPresent=${finding.escapedPresent}`,
  ),
];

await writeFile(`${EVIDENCE}/xss-test.txt`, lines.join('\n'));

if (rawLeakCount > 0) {
  console.error(`FAIL: ${rawLeakCount} raw payload(s) leaked into HTML output.`);
  process.exit(1);
}

console.log(`PASS: All ${findings.length} XSS probes were escaped or not rendered.`);
console.log(JSON.stringify(report, null, 2));
