// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// bypassCSP is required because the rendered page sets script-src 'none',
// which would otherwise block axe-core injection.
import { chromium } from '../node_modules/.bun/playwright-core@1.60.0/node_modules/playwright-core/index.mjs';

const URL_TARGET = process.env.AUDIT_URL ?? 'http://localhost:64385/pr-explainer.html';
const EVIDENCE = '/Users/vkotai/work/azri/.sisyphus/evidence/task-50';
const AXE_PATH =
  '/Users/vkotai/work/azri/node_modules/.bun/axe-core@4.11.4/node_modules/axe-core/axe.min.js';

function linearize(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relLum([r, g, b]: [number, number, number, number]): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function parseColor(s: string): [number, number, number, number] | null {
  const m = s.match(/rgba?\(([^)]+)\)/u);
  if (!m || !m[1]) return null;
  const parts = m[1].split(',').map((p) => Number(p.trim()));
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1];
}

type AxeViolation = {
  id: string;
  impact: string | null;
  nodes: Array<{ target: string[] }>;
  help: string;
  helpUrl: string;
};

type AxeResults = {
  violations: AxeViolation[];
  passes: unknown[];
  incomplete: unknown[];
  inapplicable: unknown[];
};

const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXEC ??
  '/Users/vkotai/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  await page.goto(URL_TARGET, { waitUntil: 'load' });

  const axeSrc = await Bun.file(AXE_PATH).text();
  await page.addScriptTag({ content: axeSrc });

  const axeResults = (await page.evaluate(async () => {
    // @ts-expect-error window.axe is injected at runtime
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
    });
  })) as AxeResults;
  await writeFile(join(EVIDENCE, 'axe-pr-explainer.json'), JSON.stringify(axeResults, null, 2));

  const TAB_PRESSES = 30;
  const tabLog: Array<{ step: number; tag: string; text: string; href?: string; id?: string }> = [];
  for (let i = 1; i <= TAB_PRESSES; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const ae = document.activeElement as HTMLElement | null;
      if (!ae) return { tag: 'NONE', text: '', href: '', id: '' };
      const href = ae instanceof HTMLAnchorElement ? ae.href : '';
      return {
        tag: ae.tagName,
        text: (ae.textContent ?? '').slice(0, 40).replace(/\s+/gu, ' ').trim(),
        href,
        id: ae.id ?? '',
      };
    });
    tabLog.push({ step: i, ...info });
  }
  await writeFile(
    join(EVIDENCE, 'keyboard-nav.json'),
    JSON.stringify({ url: URL_TARGET, presses: TAB_PRESSES, log: tabLog }, null, 2),
  );

  const contrastRaw = await page.evaluate(
    `(() => {
      const parseColor = ${parseColor.toString()};
      function effectiveBg(el) {
        let cur = el;
        while (cur) {
          const bg = parseColor(getComputedStyle(cur).backgroundColor);
          if (bg && bg[3] > 0) return bg;
          cur = cur.parentElement;
        }
        return [255, 255, 255, 1];
      }
      const results = [];
      const sel = 'h1, h2, h3, h4, p, a, li, span, .header-summary, .header-meta, .toc-num, .header-link';
      const els = document.querySelectorAll(sel);
      for (const el of Array.from(els)) {
        const txt = (el.textContent ?? '').trim();
        if (!txt || el.childElementCount > 0) continue;
        const cs = getComputedStyle(el);
        const fg = parseColor(cs.color);
        if (!fg) continue;
        const bg = effectiveBg(el);
        const fontSize = parseFloat(cs.fontSize);
        const fontWeight = parseInt(cs.fontWeight, 10);
        const isLarge = fontSize >= 18.66 || (fontSize >= 14 && fontWeight >= 700);
        const requiredRatio = isLarge ? 3 : 4.5;
        results.push({
          selector: el.tagName + (el.className ? '.' + el.className.split(/\\s+/u).join('.') : ''),
          text: txt.slice(0, 60),
          fg: 'rgb(' + fg[0] + ',' + fg[1] + ',' + fg[2] + ')',
          bg: 'rgb(' + bg[0] + ',' + bg[1] + ',' + bg[2] + ')',
          fontSize,
          fontWeight,
          requiredRatio,
        });
      }
      return { total: results.length, sample: results.slice(0, 50), all: results };
    })()`,
  );
  const contrastAll = contrastRaw.all.map((entry) => {
    const fgMatch = entry.fg.match(/rgb\((\d+),(\d+),(\d+)\)/u);
    const bgMatch = entry.bg.match(/rgb\((\d+),(\d+),(\d+)\)/u);
    const fg: [number, number, number, number] = [
      Number(fgMatch?.[1] ?? 0),
      Number(fgMatch?.[2] ?? 0),
      Number(fgMatch?.[3] ?? 0),
      1,
    ];
    const bg: [number, number, number, number] = [
      Number(bgMatch?.[1] ?? 255),
      Number(bgMatch?.[2] ?? 255),
      Number(bgMatch?.[3] ?? 255),
      1,
    ];
    const fgLum = relLum(fg);
    const bgLum = relLum(bg);
    const ratio = fgLum > bgLum ? (fgLum + 0.05) / (bgLum + 0.05) : (bgLum + 0.05) / (fgLum + 0.05);
    const pass = ratio >= entry.requiredRatio;
    return { ...entry, ratio: Math.round(ratio * 100) / 100, pass };
  });
  const contrast = {
    total: contrastRaw.total,
    failing: contrastAll.filter((entry) => !entry.pass).length,
    sample: contrastAll.slice(0, 50),
    allFailing: contrastAll.filter((entry) => !entry.pass),
  };
  await writeFile(join(EVIDENCE, 'contrast.json'), JSON.stringify(contrast, null, 2));

  await page.screenshot({
    path: join(EVIDENCE, 'screenshots', 'pr-explainer-post-audit.png'),
    fullPage: true,
  });

  const summary = {
    url: URL_TARGET,
    axe: {
      violations: axeResults.violations.length,
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete.length,
      inapplicable: axeResults.inapplicable.length,
      violationDetails: axeResults.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        help: v.help,
        helpUrl: v.helpUrl,
        targets: v.nodes.slice(0, 5).map((n) => n.target),
      })),
    },
    keyboard: {
      presses: TAB_PRESSES,
      uniqueTargets: new Set(tabLog.map((t) => t.tag + ':' + t.text)).size,
      anchors: tabLog.filter((t) => t.tag === 'A').length,
    },
    contrast: {
      totalChecked: contrast.total,
      failingCount: contrast.failing,
      worstRatio: null,
    },
  };
  await writeFile(join(EVIDENCE, 'audit-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await browser.close();
}
