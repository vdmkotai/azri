// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { chromium } from '../../../node_modules/.bun/playwright@1.60.0/node_modules/playwright/index.mjs';

import { PRESETS_V3 } from '../src/design-system/presets-v3/index.ts';

const AXE_PATH =
  '/Users/vkotai/work/azri/node_modules/.bun/axe-core@4.11.4/node_modules/axe-core/axe.min.js';
const REPORT_PATH = '/tmp/azri-v3-axe-report.md';

interface AxeNode {
  readonly target: readonly string[];
  readonly html: string;
  readonly failureSummary?: string;
}

interface AxeViolation {
  readonly id: string;
  readonly impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  readonly help: string;
  readonly helpUrl: string;
  readonly tags: readonly string[];
  readonly nodes: readonly AxeNode[];
}

interface AxeResults {
  readonly violations: readonly AxeViolation[];
  readonly passes: readonly unknown[];
  readonly incomplete: readonly unknown[];
  readonly inapplicable: readonly unknown[];
}

interface ThemeReport {
  readonly theme: string;
  readonly url: string;
  readonly violations: readonly AxeViolation[];
  readonly passes: number;
}

async function auditTheme(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  axeSrc: string,
  theme: string,
): Promise<ThemeReport> {
  const filePath = `/tmp/azri-v3-gallery-${theme}.html`;
  if (!existsSync(filePath)) {
    throw new Error(`Gallery file missing: ${filePath} (run v3-gallery.ts first).`);
  }
  const url = pathToFileURL(filePath).href;

  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'load' });
    await page.addScriptTag({ content: axeSrc });
    const axeResults = (await page.evaluate(async () => {
      // @ts-expect-error window.axe injected at runtime
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
        resultTypes: ['violations', 'passes'],
      });
    })) as AxeResults;
    return {
      theme,
      url,
      violations: axeResults.violations,
      passes: axeResults.passes.length,
    };
  } finally {
    await context.close();
  }
}

function formatViolation(violation: AxeViolation, themeName: string): string {
  const impact = (violation.impact ?? 'unknown').toUpperCase();
  const sampleNodes = violation.nodes.slice(0, 3).map((node, index) => {
    const target = node.target.join(' ');
    const summary = (node.failureSummary ?? '').replace(/\n+/gu, ' ').trim();
    return `   ${index + 1}. \`${target}\`${summary ? ` — ${summary}` : ''}`;
  });
  return [
    `### [${themeName}] ${violation.id} (${impact}) — ${violation.nodes.length} node(s)`,
    `- ${violation.help}`,
    `- [Rule docs](${violation.helpUrl})`,
    `- Tags: ${violation.tags.join(', ')}`,
    '- Sample nodes:',
    ...sampleNodes,
    '',
  ].join('\n');
}

function buildReport(reports: readonly ThemeReport[]): string {
  const totalViolations = reports.reduce((sum, report) => sum + report.violations.length, 0);
  const totalPasses = reports.reduce((sum, report) => sum + report.passes, 0);
  const generatedAt = new Date().toISOString();

  const header = [
    '# Azri v0.3 — Section gallery axe-core report',
    '',
    `Generated: ${generatedAt}`,
    `Themes audited: ${reports.length}`,
    `Total violations: ${totalViolations}`,
    `Total passes: ${totalPasses}`,
    '',
    '## Summary',
    '',
    '| Theme | Violations | Passes |',
    '|---|---:|---:|',
    ...reports.map(
      (report) => `| \`${report.theme}\` | ${report.violations.length} | ${report.passes} |`,
    ),
    '',
  ];

  const detail: string[] = [];
  for (const report of reports) {
    if (report.violations.length === 0) {
      detail.push(`## ${report.theme}\n\nNo violations.\n`);
      continue;
    }
    detail.push(`## ${report.theme}\n`);
    for (const violation of report.violations) {
      detail.push(formatViolation(violation, report.theme));
    }
  }

  return `${header.join('\n')}\n${detail.join('\n')}`;
}

const axeSrc = await Bun.file(AXE_PATH).text();

const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXEC ??
  '/Users/vkotai/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell';

const browser = await chromium.launch({ headless: true, executablePath });
try {
  const reports: ThemeReport[] = [];
  for (const theme of Object.keys(PRESETS_V3)) {
    console.log(`[axe] auditing ${theme} ...`);
    const report = await auditTheme(browser, axeSrc, theme);
    console.log(`[axe]   ${report.violations.length} violations, ${report.passes} passes`);
    reports.push(report);
  }
  const report = buildReport(reports);
  await writeFile(REPORT_PATH, report, 'utf8');

  const total = reports.reduce((sum, r) => sum + r.violations.length, 0);
  console.log('');
  console.log(`Wrote ${REPORT_PATH}`);
  console.log(`Total violations across ${reports.length} themes: ${total}`);
} finally {
  await browser.close();
}
