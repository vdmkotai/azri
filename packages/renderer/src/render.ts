// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';

import type {
  ChangeSet,
  DesignTokens,
  DiagramSpec,
  ExplainerPlan,
  HtmlBundle,
  Importance,
  RepoSnapshot,
  RunMetadata,
  Section,
} from '../../types/src/index.ts';
import {
  Callout,
  CitationFootnote,
  Header,
  MermaidDiagram,
  Section as SectionC,
  StickyTOC,
  type TocSection,
} from './components/index.ts';
import { applyDesignTokens, RESET_CSS, resolveTheme, tokenCss } from './design-system/index.ts';
import { renderMermaidToSvg } from './diagrams/index.ts';
import { escapeAttr, escapeHtml } from './utils/escape-html.ts';
import { markdownToHtml } from './utils/markdown.ts';

export interface RenderOptions {
  tokens?: DesignTokens;
  theme?: string;
  generatedAt?: string;
  runMeta?: Partial<RunMetadata>;
  githubBaseUrl?: string;
  prUrl?: string;
}

const IMPORTANCE_ORDER: Record<Importance, number> = {
  critical: 0,
  important: 1,
  supporting: 2,
  context: 3,
};

const BASE_CSS = `
body{margin:0;font-family:var(--typeface-serif);background:var(--color-bg);color:var(--color-text);line-height:1.55;}
.shell{display:grid;grid-template-columns:260px 1fr;gap:48px;max-width:1180px;margin:0 auto;padding:32px 28px;}
@media (max-width:900px){.shell{grid-template-columns:1fr;}}
.azri-toc{position:sticky;top:24px;align-self:start;font-size:14px;line-height:1.5;border-right:1px solid color-mix(in srgb, var(--color-text) 20%, transparent);padding-right:20px;}
.azri-toc .toc-title{font-family:var(--typeface-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;margin:0 0 12px;}
.azri-toc ol{list-style:none;margin:0;padding:0;}
.azri-toc li{margin:6px 0;}
.azri-toc a{color:inherit;text-decoration:none;}
.azri-toc a:hover{color:var(--color-accent);}
.azri-toc .toc-num{font-family:var(--typeface-mono);font-size:12px;opacity:.6;margin-right:6px;}
.azri-header{margin-bottom:48px;padding-bottom:32px;border-bottom:1px solid color-mix(in srgb, var(--color-text) 15%, transparent);}
.azri-header h1{font-size:42px;line-height:1.1;margin:0 0 12px;}
.azri-header .header-summary{font-size:20px;opacity:.8;}
.azri-header .header-link{display:inline-block;margin-top:12px;color:var(--color-accent);}
.azri-header .header-meta{font-family:var(--typeface-mono);font-size:12px;opacity:.6;margin-top:12px;}
.azri-section{margin-bottom:48px;}
.azri-section h2{font-size:28px;margin:32px 0 16px;}
.azri-section[data-importance="critical"] h2::before{content:"\u25CF";color:var(--severity-critical);margin-right:8px;font-size:14px;vertical-align:middle;}
.azri-section[data-importance="important"] h2::before{content:"\u25CF";color:var(--severity-warn);margin-right:8px;font-size:14px;vertical-align:middle;}
.azri-section .section-body p{margin:0 0 14px;}
.azri-callout{border-left:3px solid;padding:14px 18px;margin:18px 0;background:color-mix(in srgb, var(--color-text) 5%, transparent);border-radius:0 4px 4px 0;}
.azri-callout-info{border-color:var(--severity-info);}
.azri-callout-warn{border-color:var(--severity-warn);}
.azri-callout-critical{border-color:var(--severity-critical);}
.azri-callout .callout-label{font-family:var(--typeface-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:6px;opacity:.85;}
.azri-code{font-family:var(--typeface-mono);font-size:13px;background:var(--color-bg-code-background);color:var(--color-bg-code-text);padding:16px;border-radius:4px;overflow-x:auto;}
.azri-code code{background:none;color:inherit;font:inherit;}
.azri-annotated-diff{margin:18px 0;}
.azri-diff-file{margin:12px 0;border:1px solid color-mix(in srgb, var(--color-text) 15%, transparent);border-radius:4px;overflow:hidden;}
.azri-diff-file .diff-filename{font-family:var(--typeface-mono);font-size:12px;padding:6px 12px;background:color-mix(in srgb, var(--color-text) 6%, transparent);}
.diff-annotation{font-family:var(--typeface-mono);font-size:12px;padding:6px 12px;border-top:1px solid color-mix(in srgb, var(--color-text) 10%, transparent);}
.diff-annotation-info{background:color-mix(in srgb, var(--severity-info) 8%, transparent);}
.diff-annotation-warn{background:color-mix(in srgb, var(--severity-warn) 10%, transparent);}
.diff-annotation-critical{background:color-mix(in srgb, var(--severity-critical) 12%, transparent);}
.diff-body{font-family:var(--typeface-mono);font-size:12px;line-height:1.5;}
.diff-line{padding:0 12px;white-space:pre;}
.diff-line-add{background:color-mix(in srgb, var(--severity-info) 6%, transparent);}
.diff-line-del{background:color-mix(in srgb, var(--severity-critical) 6%, transparent);}
.diff-line-meta{opacity:.6;}
.azri-mermaid{margin:24px 0;padding:16px;background:color-mix(in srgb, var(--color-text) 4%, transparent);border-radius:6px;text-align:center;}
.azri-mermaid svg{max-width:100%;height:auto;display:inline-block;}
.azri-mermaid figcaption{font-style:italic;opacity:.7;font-size:13px;margin-top:8px;}
.azri-citations{margin-top:48px;padding-top:24px;border-top:1px solid color-mix(in srgb, var(--color-text) 15%, transparent);}
.azri-citations h3{font-family:var(--typeface-mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;}
.azri-citations ol{font-family:var(--typeface-mono);font-size:13px;}
.azri-citations a{color:var(--color-accent);}
`.trim();

function sortByImportance(sections: ReadonlyArray<Section>): Section[] {
  const copy: Section[] = Array.from(sections);
  copy.sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]);
  return copy;
}

function renderSection(
  section: Section,
  plan: ExplainerPlan,
  diagramSvgById: ReadonlyMap<string, string>,
): string {
  const prose = section.proseMarkdown
    ? markdownToHtml(section.proseMarkdown)
    : '<p><em>(no content)</em></p>';
  const parts: string[] = [prose];

  if (section.sectionType === 'risk-callouts') {
    for (const risk of plan.risks) {
      parts.push(
        Callout({
          severity: risk.severity,
          label: risk.category,
          children: `<p>${escapeHtml(risk.summary)}</p>`,
        }),
      );
    }
  }

  if (section.diagramId) {
    const svg = diagramSvgById.get(section.diagramId);
    if (svg) {
      const spec = plan.diagramSpecs.find((d) => d.id === section.diagramId);
      parts.push(
        MermaidDiagram({
          svgString: svg,
          ariaLabel: 'Section diagram',
          ...(spec ? { caption: `Diagram: ${spec.kind}` } : {}),
        }),
      );
    }
  }

  return SectionC({
    id: section.id,
    title: section.title,
    importance: section.importance,
    children: parts.join('\n'),
  });
}

function buildMetaTags(plan: ExplainerPlan): string {
  const title = escapeAttr(plan.title);
  const desc = escapeAttr(plan.summary.slice(0, 200));
  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="generator" content="azri">',
    `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src data: 'self' https://github.com; base-uri 'none'; form-action 'none';">`,
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:type" content="article">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${desc}">`,
  ].join('\n');
}

export async function renderPage(
  plan: ExplainerPlan,
  _change: ChangeSet | undefined,
  _repo: RepoSnapshot,
  opts: RenderOptions = {},
): Promise<HtmlBundle> {
  const baseTokens = resolveTheme(opts.theme);
  const tokensCss = tokenCss(applyDesignTokens(opts.tokens, baseTokens));

  const diagramRenders = await Promise.all(
    plan.diagramSpecs.map(async (d: DiagramSpec) => {
      const svg = d.renderedSvg ?? (await renderMermaidToSvg(d.mermaidSource));
      return [d.id, svg] as const;
    }),
  );
  const diagramSvgById = new Map<string, string>(diagramRenders);

  const sortedSections = sortByImportance(plan.sections);

  const tocItems: TocSection[] = sortedSections.map((s) => ({
    id: s.id,
    title: s.title,
    importance: s.importance,
  }));

  const headerHtml = Header({
    title: plan.title,
    summary: plan.summary,
    ...(opts.prUrl ? { prUrl: opts.prUrl } : {}),
    ...(opts.runMeta
      ? {
          runMeta: {
            runId: opts.runMeta.runId ?? 'unknown',
            generatedAt: opts.generatedAt ?? '',
            ...(opts.runMeta.costUsd === undefined ? {} : { costUsd: opts.runMeta.costUsd }),
          },
        }
      : {}),
  });

  const tocHtml = StickyTOC({ sections: tocItems });
  const sectionsHtml = sortedSections.map((s) => renderSection(s, plan, diagramSvgById)).join('\n');

  const allCitations = plan.risks.flatMap((r) => r.citations);
  const citationsHtml =
    allCitations.length > 0
      ? CitationFootnote({
          citations: allCitations,
          ...(opts.githubBaseUrl ? { githubBaseUrl: opts.githubBaseUrl } : {}),
        })
      : '';

  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    buildMetaTags(plan),
    '<style>',
    RESET_CSS,
    tokensCss,
    BASE_CSS,
    '</style>',
    '</head>',
    '<body>',
    '<div class="shell">',
    tocHtml,
    '<main>',
    headerHtml,
    sectionsHtml,
    citationsHtml,
    '</main>',
    '</div>',
    '</body>',
    '</html>',
  ].join('\n');

  const sizeBytes = Buffer.byteLength(html, 'utf8');
  const contentHash = createHash('sha256').update(html).digest('hex');
  return { html, sizeBytes, contentHash };
}
