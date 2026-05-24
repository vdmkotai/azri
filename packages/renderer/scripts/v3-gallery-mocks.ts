// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

/* eslint-disable max-lines */

export const GALLERY_MOCKS: Record<string, unknown> = {
  tldr: {
    hook: 'Azri turns any GitHub repo or PR into a self-contained explanation page in under a minute.',
    description:
      'It runs a six-stage LLM pipeline that triages the input, plans the document outline, fills each section in parallel, and renders a single CDN-only HTML file ready to share with reviewers, teammates, and stakeholders.',
    stats: [
      { label: 'Sections', value: '37', hint: 'Composable section types' },
      { label: 'Themes', value: '5', hint: 'Calibrated for WCAG AA' },
      { label: 'Pipeline stages', value: '6', hint: 'Triage to validate' },
      { label: 'CDN deps', value: '4', hint: 'Tailwind, Mermaid, Lucide, Simple Icons' },
    ],
  },

  'stack-grid': {
    title: 'Built with',
    items: [
      { name: 'Bun', slug: 'bun', role: 'Runtime + package manager', category: 'Build' },
      { name: 'TypeScript', slug: 'typescript', role: 'Type-safe source', category: 'Framework' },
      { name: 'Effect', slug: 'effect', role: 'Structured concurrency', category: 'Framework' },
      { name: 'Zod', slug: 'zod', role: 'Runtime schema validation', category: 'Framework' },
      { name: 'Tailwind CSS', slug: 'tailwindcss', role: 'Utility-first styling', category: 'UI' },
      { name: 'Anthropic', slug: 'anthropic', role: 'Primary LLM provider', category: 'Other' },
    ],
  },

  'entity-grid': {
    title: 'Cast of characters',
    entities: [
      {
        name: 'Triage',
        role: 'Decides what to build',
        tech: 'Effect',
        color: 'blue',
        description:
          'Inspects the repo size, languages, manifests, and recent activity to decide which sections deserve a slot on the page.',
      },
      {
        name: 'Planner',
        role: 'Picks the section list',
        tech: 'LLM',
        color: 'purple',
        description:
          'Reads the section catalog and asks the model to assemble an ordered list biased toward richer pages.',
      },
      {
        name: 'Producer',
        role: 'Fills each section',
        tech: 'Promise.all',
        color: 'orange',
        description:
          'Fans out per-section prompts in parallel with a concurrency cap of six and validates each result against its Zod schema.',
      },
      {
        name: 'Renderer',
        role: 'Assembles the HTML',
        tech: 'Tailwind v4',
        color: 'green',
        description:
          'Stitches the per-section HTML into the page shell, injects the theme CSS, and writes the final document.',
      },
    ],
  },

  'entity-card': {
    entity: {
      name: 'Planner',
      role: 'Stage 2 — picks the section list',
      tech: 'LLM',
      color: 'purple',
      description:
        'The planner receives the triage report plus the section catalog and outputs a JSON list of section IDs with one-line rationales.',
    },
    sections: [
      {
        heading: 'Input',
        body: 'Repo snapshot summary, language histogram, package manifests, recent commit titles, and the full catalog of available section types.',
      },
      {
        heading: 'Output',
        body: 'Ordered list of section IDs the producer should run, with a short rationale per pick so reviewers can audit the choices.',
      },
      {
        heading: 'Guardrails',
        body: 'tldr first, key-files always on repo pages, pr-tldr always on PR pages, and the catalog is hard-validated against the registry.',
      },
    ],
  },

  'architecture-decision': {
    title: 'CDN-first rendering vs. self-contained bundles',
    decision:
      'Ship the renderer as a thin HTML shell that pulls Tailwind, Mermaid, and Lucide from public CDNs.',
    alternatives: [
      {
        option: 'Inline every dependency as base64 into the HTML',
        why_not: 'Bundle size balloons past 2 MB and breaks GitHub Pages caching.',
      },
      {
        option: 'Run a build step that produces a hashed Tailwind bundle per theme',
        why_not:
          'Requires a Node build pipeline at render time and defeats the "single binary" promise.',
      },
    ],
    why: 'CDN delivery keeps the generated file under 200 KB while preserving full Tailwind utility coverage. Cache hit-rates on jsDelivr push median load time below 600 ms even on fresh devices.',
    tradeoffs: {
      gain: 'Tiny HTML output, instant updates when Tailwind ships fixes, no local build dependency.',
      cost: 'Requires network access to render the page; CSP must permit jsdelivr and simpleicons CDNs.',
    },
    citations: ['docs/OPERATOR.md#cdn-policy', '.sisyphus/plans/v0.3.md — Architecture Pillars'],
  },

  'mermaid-diagram': {
    title: 'Render pipeline',
    kind: 'flowchart',
    source: `flowchart LR
  Triage --> Plan
  Plan --> Produce
  Produce --> Render
  Render --> Validate`,
    caption: 'Five distinct stages — each one is replaceable in isolation.',
  },

  'code-walkthrough': {
    title: 'How the orchestrator wraps each section',
    filePath: 'packages/renderer/src/v3/render.ts',
    lineRange: '36-41',
    language: 'typescript',
    code: `function renderSection(section, theme) {
  const type = getSection(section.id);
  return \`<section id="\${escapeHtml(section.id)}" class="scroll-mt-8 my-4">
  \${type.render(section.data, theme)}
</section>\`;
}`,
    annotations: [
      {
        lineOffset: 1,
        text: 'Look up the SectionType from the registry — throws if the id is unknown.',
      },
      {
        lineOffset: 2,
        text: 'The outer wrapper carries the anchor id used by the table of contents.',
      },
      {
        lineOffset: 3,
        text: 'The renderer is responsible only for the inner fragment (no nested ids).',
      },
    ],
  },

  'data-table': {
    title: 'Section cost budget',
    columns: [
      { key: 'section', label: 'Section', align: 'left' },
      { key: 'in', label: 'Tokens in', align: 'right' },
      { key: 'out', label: 'Tokens out', align: 'right' },
    ],
    rows: [
      { section: 'tldr', in: 2000, out: 400 },
      { section: 'stack-grid', in: 1500, out: 300 },
      { section: 'architecture-decision', in: 4000, out: 700 },
      { section: 'investigation', in: 4500, out: 900 },
    ],
    caption: 'Estimated per-section token usage for an average repo.',
  },

  'comparison-table': {
    title: 'v0.2 renderer vs. v0.3 renderer',
    leftLabel: 'v0.2 (legacy)',
    rightLabel: 'v0.3 (studio)',
    rows: [
      {
        aspect: 'Styling',
        left: 'Hand-coded CSS bundle',
        right: 'Tailwind v4 via Play CDN',
        change: 'changed',
      },
      {
        aspect: 'Sections',
        left: '7 fixed types',
        right: '37 LLM-picked types',
        change: 'changed',
      },
      {
        aspect: 'Diagrams',
        left: 'Headless-browser SSR',
        right: 'Mermaid Tiny client-side',
        change: 'changed',
      },
      {
        aspect: 'Themes',
        left: 'Hex token objects',
        right: '@theme blocks (OKLCH)',
        change: 'changed',
      },
      { aspect: 'Page weight', left: '~340 KB', right: '~85 KB', change: 'changed' },
    ],
  },

  'risk-callout': {
    severity: 'warn',
    title: 'Tailwind Play CDN requires inline styles',
    body: "The Tailwind v4 browser build injects runtime <style> tags, so the page CSP must allow style-src 'unsafe-inline'.",
    suggestion:
      'Document the relaxed CSP and offer a strict mode that swaps to a pre-built bundle.',
  },

  'link-callout': {
    url: 'https://tailwindcss.com/docs/v4-beta',
    title: 'Tailwind CSS v4 beta release notes',
    description:
      'The full list of utility class changes between v3 and v4 — required reading before editing renderers.',
    kind: 'docs',
  },

  'quote-callout': {
    quote:
      'A good explainer page does not summarize the diff. It reconstructs the decision that produced the diff and lets the reader audit it.',
    attribution: {
      source: 'Azri design notes, 2026',
    },
  },

  'project-overview': {
    headline: 'Azri turns Git repositories into shareable explanation pages.',
    description:
      'It runs locally as a CLI or as a self-hosted GitHub bot, processes any public repo or pull request through a six-stage LLM pipeline, and produces a single self-contained HTML file that explains both the what and the why.',
    personas: [
      {
        name: 'Reviewer',
        motivation: 'Wants the why behind a PR before scrolling through 800 lines of diff.',
      },
      {
        name: 'New hire',
        motivation: 'Wants a one-page architecture tour without reading every README.',
      },
      {
        name: 'Tech lead',
        motivation: 'Wants a defensible record of decisions made during a release.',
      },
    ],
  },

  'user-flow': {
    title: 'How a user generates a page',
    steps: [
      {
        number: 1,
        title: 'Install',
        description: 'Run bun install -g @vdmkotai/azri.',
        icon: 'download',
      },
      {
        number: 2,
        title: 'Authenticate',
        description: 'Drop an Anthropic or OpenAI key into azri auth login.',
        icon: 'key',
      },
      {
        number: 3,
        title: 'Run',
        description: 'Paste a PR URL or point at a local repo and wait for the pipeline.',
        icon: 'play',
      },
      {
        number: 4,
        title: 'Share',
        description: 'Open the generated HTML or upload it to any static host.',
        icon: 'share',
      },
    ],
  },

  'ui-overview': {
    title: 'Generated page layout',
    regions: [
      {
        name: 'Header',
        role: 'Identity block',
        contents: 'Page title, run id, generated-at timestamp, repo + PR links.',
      },
      {
        name: 'Sidebar TOC',
        role: 'Navigation',
        contents: 'Sticky list of every section anchor, scroll-spy via id targets.',
      },
      {
        name: 'Main',
        role: 'Content column',
        contents: 'Each chosen section rendered in order with a 64-rem max width.',
      },
    ],
    mockupAscii: `+----------------------------------------------+
|  AZRI STUDIO                   Generated ...  |
|  Page title                                   |
+----------------+-----------------------------+
|                |                             |
|  Contents      |  Main content              |
|  - TL;DR       |  +-------------------------+ |
|  - Stack       |  |  Section 1             | |
|  - Cast        |  +-------------------------+ |
|  - Decisions   |  +-------------------------+ |
|  - Investigation|  |  Section 2             | |
|                |  +-------------------------+ |
+----------------+-----------------------------+`,
  },

  'feature-list': {
    title: 'Feature highlights',
    features: [
      {
        name: 'Dynamic sections',
        description: 'LLM picks 5–25 sections per page based on the input scale.',
        status: 'shipped',
        icon: 'shuffle',
      },
      {
        name: 'Client-side diagrams',
        description:
          'Mermaid renders in the browser via the Tiny build — no headless Chromium needed.',
        status: 'shipped',
        icon: 'workflow',
      },
      {
        name: 'Brand icons',
        description: 'Simple Icons CDN delivers per-tech badges without an inline icon pack.',
        status: 'shipped',
        icon: 'star',
      },
      {
        name: 'Theme calibration',
        description: 'Five accessibility-tuned themes via OKLCH @theme blocks.',
        status: 'beta',
        icon: 'palette',
      },
      {
        name: 'Plugin sections',
        description: 'External packages can register their own section types.',
        status: 'planned',
        icon: 'puzzle',
      },
    ],
  },

  'data-flow-diagram': {
    title: 'Data flow through the pipeline',
    mermaidSource: `flowchart LR
  Input[Repo or PR URL] --> S0[Triage]
  S0 --> S1[Summarize]
  S1 --> S2[Plan]
  S2 --> S3[Produce]
  S3 --> S4[Render]
  S4 --> S5[Validate]
  S5 --> Out[Self-contained HTML]`,
    steps: [
      { number: 1, action: 'The CLI clones the repo or pulls the PR diff into memory.' },
      {
        number: 2,
        action:
          'Triage emits a structured summary with languages, manifest contents, and tree shape.',
      },
      {
        number: 3,
        action: 'The planner asks the LLM to pick an ordered list of sections from the registry.',
      },
      {
        number: 4,
        action:
          'The producer dispatches each section prompt in parallel, validating responses against Zod.',
      },
      {
        number: 5,
        action: 'The renderer assembles every section into the page shell and writes it to disk.',
      },
    ],
    notes:
      'Each stage emits structured logs; failures retry once with the prior error in context before being skipped.',
  },

  'deployment-map': {
    title: 'Where Azri runs',
    deployments: [
      {
        component: 'CLI',
        runtime: 'Bun 1.3',
        host: 'self-hosted',
        notes: 'Distributed via npm, executed locally.',
      },
      {
        component: 'Bot API',
        runtime: 'Bun 1.3 + Effect HTTP',
        host: 'railway',
        region: 'us-east',
      },
      {
        component: 'Static examples',
        runtime: 'Plain HTML',
        host: 'cdn',
        notes: 'Served from GitHub Pages with global CDN.',
      },
    ],
  },

  'directory-tree': {
    title: 'Repository layout',
    root: 'azri',
    entries: [
      {
        path: 'apps/cli',
        kind: 'dir',
        description: 'User-facing CLI entry point — Bun executable.',
      },
      { path: 'apps/bot', kind: 'dir', description: 'Self-hosted GitHub App webhook receiver.' },
      {
        path: 'packages/core',
        kind: 'dir',
        description: 'Pipeline stages, section registry, orchestrator.',
      },
      {
        path: 'packages/renderer',
        kind: 'dir',
        description: 'HTML shell, themes, section render helpers.',
      },
      {
        path: 'packages/types',
        kind: 'dir',
        description: 'Shared TypeScript types across packages.',
      },
      {
        path: 'packages/adapters',
        kind: 'dir',
        description: 'Provider adapters (Anthropic, OpenAI, Google).',
      },
      { path: 'examples', kind: 'dir', description: 'Pre-rendered HTML for the README.' },
      {
        path: 'AGENTS.md',
        kind: 'file',
        description: 'Operating rules for AI assistants editing this repo.',
      },
    ],
  },

  'key-files': {
    title: 'Start reading here',
    files: [
      {
        path: 'apps/cli/src/index.ts',
        importance: 'entry',
        why_first: 'The CLI entry — every command flows through this dispatcher.',
      },
      {
        path: 'packages/core/src/pipeline/v3/orchestrator.ts',
        importance: 'critical',
        why_first: 'Owns the v0.3 pipeline; reads top-to-bottom like a runbook.',
      },
      {
        path: 'packages/core/src/sections/registry.ts',
        importance: 'critical',
        why_first: 'Every section type registers itself here at import time.',
      },
      {
        path: 'packages/renderer/src/v3/template.ts',
        importance: 'reference',
        why_first: 'Defines the HTML shell, CSP, and CDN script tags.',
      },
      {
        path: 'AGENTS.md',
        importance: 'reference',
        why_first: 'Coding rules, stack constraints, and quality gates for contributors.',
      },
    ],
  },

  'database-schema': {
    title: 'Section registry storage',
    tables: [
      {
        name: 'sections',
        kind: 'kv',
        purpose: 'In-memory map populated at import time via registerSection().',
        fields: [
          { name: 'id', type: 'string', notes: 'Stable identifier used by the planner.' },
          { name: 'name', type: 'string', notes: 'Human label shown in the TOC.' },
          { name: 'applicableFor', type: 'string[]', notes: 'Allowed modes: repo or pr.' },
          { name: 'schema', type: 'ZodSchema', notes: 'Output validator.' },
        ],
      },
      {
        name: 'producedSections',
        kind: 'document',
        purpose: 'Per-run snapshot of validated section outputs handed to the renderer.',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'rationale', type: 'string', notes: 'Why the planner picked this section.' },
          { name: 'data', type: 'unknown', notes: 'Schema-validated payload for render().' },
        ],
      },
    ],
  },

  'api-surface': {
    title: 'Bot webhook endpoints',
    endpoints: [
      {
        method: 'POST',
        path: '/webhook',
        purpose: 'GitHub App webhook receiver — handles pull_request events.',
      },
      {
        method: 'GET',
        path: '/health',
        purpose: 'Container liveness probe; returns 200 with build sha.',
      },
      {
        method: 'GET',
        path: '/version',
        purpose: 'Reports the deployed Azri version and supported providers.',
      },
    ],
  },

  'getting-started': {
    title: 'Try it locally',
    prereqs: [
      { tool: 'Bun', version: '>=1.3.0', slug: 'bun' },
      { tool: 'Git', version: '>=2.40', slug: 'git' },
      { tool: 'Anthropic key', slug: 'anthropic' },
    ],
    steps: [
      { command: 'bun install -g @vdmkotai/azri', description: 'Install the CLI globally.' },
      {
        command: 'azri auth login --provider anthropic',
        description: 'Store your API key in the OS keychain.',
      },
      {
        command: 'azri pr https://github.com/owner/repo/pull/123',
        description: 'Generate a PR explainer page.',
      },
    ],
  },

  'whats-next': {
    title: 'Recent and upcoming work',
    recentCommits: [
      {
        sha: 'a1b2c3d',
        message: 'feat(renderer): wire 12 PR-only sections',
        author: 'sisyphus',
        date: '2026-05-24',
      },
      {
        sha: 'e4f5a6b',
        message: 'feat(core): stage-3 producer with concurrency cap',
        author: 'sisyphus',
        date: '2026-05-23',
      },
      {
        sha: 'c7d8e9f',
        message: 'feat(renderer): v3 shell + CSP',
        author: 'sisyphus',
        date: '2026-05-22',
      },
    ],
    openPRs: [
      { number: 142, title: 'Theme calibration pass for sepia + brutalist', status: 'open' },
    ],
    plannedWork: [
      { title: 'Plugin system for third-party section types', source: '.sisyphus/plans/v0.4.md' },
      { title: 'Hosted dashboard at azri.dev', source: 'roadmap (v0.5)' },
    ],
  },

  glossary: {
    title: 'Glossary',
    terms: [
      {
        term: 'Triage',
        definition:
          'Stage 0 of the pipeline. Classifies the input and gathers metadata for the planner.',
      },
      {
        term: 'Section',
        definition:
          'Self-contained renderer module with its own schema, prompt, and HTML template.',
      },
      {
        term: 'Registry',
        definition:
          'Module-scoped map of section ids to SectionType objects, populated via import side effects.',
      },
      {
        term: '@theme',
        definition:
          'Tailwind v4 CSS-at-rule that registers design tokens as utility-class color vars.',
      },
    ],
  },

  'pr-tldr': {
    what: 'Adds the section gallery script and an axe-core sweep across all five themes.',
    why: 'Closes Phase 6 of the v0.3 plan — the last visual polish gate before cutover and release.',
    impact: 'minor',
    stats: { filesChanged: 4, additions: 612, deletions: 18 },
  },

  'change-summary': {
    title: 'What changed in this PR',
    groups: [
      {
        module: 'packages/renderer/scripts',
        rationale: 'Two new scripts (gallery + axe sweep) and one mocks helper to feed them.',
        files: [
          { path: 'packages/renderer/scripts/v3-gallery.ts', kind: 'added' },
          { path: 'packages/renderer/scripts/v3-gallery-mocks.ts', kind: 'added' },
          { path: 'packages/renderer/scripts/v3-axe-gallery.ts', kind: 'added' },
        ],
      },
      {
        module: 'packages/core/src/sections',
        rationale: 'Surgical fix: removed the duplicate-id wrapper from every section renderer.',
        files: [
          { path: 'packages/core/src/sections/tldr/render.ts', kind: 'modified' },
          { path: 'packages/core/src/sections/stack-grid/render.ts', kind: 'modified' },
        ],
      },
    ],
  },

  'annotated-diff': {
    title: 'Critical diff hunks',
    hunks: [
      {
        filePath: 'packages/core/src/sections/tldr/render.ts',
        lineRange: '26-38',
        language: 'typescript',
        code: `-  return \`<section id="tldr" class="mb-12">
+  return \`<div class="mb-12">
   <div class="rounded-card bg-surface p-8 ...">
     ...
   </div>
-</section>\`;
+</div>\`;`,
        annotation:
          'Outer wrapper now uses a div, so the orchestrator-supplied section id is unique on the page.',
      },
    ],
  },

  'before-after-flow': {
    title: 'Renderer wrapping — before vs. after',
    beforeMermaid: `flowchart LR
  Orchestrator -->|wraps in section id=tldr| InnerSection[section id=tldr]
  InnerSection --> Content`,
    afterMermaid: `flowchart LR
  Orchestrator -->|wraps in section id=tldr| InnerDiv[div]
  InnerDiv --> Content`,
    diffSummary:
      'Inner <section id="..."> is now a plain <div>, removing the duplicate-id violation flagged by axe-core.',
  },

  investigation: {
    title: 'Why was axe flagging duplicate-id?',
    hypotheses: [
      {
        number: 1,
        title: 'Renderers used unique ids that happened to collide.',
        investigation:
          'Grep showed every render.ts emitted `<section id="<id>">` with a hardcoded literal matching the section id.',
        verdict: 'confirmed',
        evidence: '37 files matched the same literal-id pattern.',
      },
      {
        number: 2,
        title: 'Orchestrator was wrapping in another section with the same id.',
        investigation:
          'Read packages/renderer/src/v3/render.ts — confirmed it emits `<section id="${section.id}">` around every renderer.',
        verdict: 'confirmed',
        evidence:
          'Outer + inner section both carry id="tldr" → axe duplicate-id violation per section.',
      },
    ],
    conclusion:
      'Removed the inner section id by switching the inner element to a div; orchestrator-supplied id is now the sole anchor target.',
  },

  'test-impact': {
    title: 'Test impact',
    added: [
      {
        testFile: 'packages/renderer/test/v3-gallery.test.ts',
        coverage: 'Smoke-tests gallery generation for every theme.',
      },
    ],
    changed: [
      {
        testFile: 'packages/core/test/sections/registry.test.ts',
        change: 'No-op; included for snapshot regen.',
      },
    ],
    uncovered: {
      areas: ['Visual regression of theme calibration changes.'],
      reason: 'Visual testing requires a hosted browser; deferred to Phase 7.',
    },
  },

  'regression-risk': {
    title: 'Regression risks introduced',
    risks: [
      {
        severity: 'low',
        area: 'Anchor links in older bookmarks',
        description:
          'Section anchors still resolve via the orchestrator-supplied id, so external links to #tldr keep working.',
        mitigation: 'Smoke-tested anchor scroll on the regenerated artsnack-v2 page.',
      },
      {
        severity: 'medium',
        area: 'Custom CSS targeting `section#tldr`',
        description:
          'Any consumer overriding section element selectors will need to switch to div selectors.',
        mitigation: 'Documented the swap in CHANGELOG and migration-notes section.',
      },
    ],
  },

  'migration-notes': {
    title: 'Migration notes for v0.3',
    isBreaking: false,
    breakingChanges: [],
    deprecations: [
      {
        what: 'Hand-coded section CSS bundle in packages/renderer/src/design-system/legacy.css',
        replacement: 'Tailwind v4 utility classes inside each renderer.',
        removalETA: 'v0.4',
      },
    ],
  },

  'verification-checklist': {
    title: 'Verification checklist',
    items: [
      {
        description: 'Gallery generates all five themed files without error.',
        verified: true,
        method: 'bun run packages/renderer/scripts/v3-gallery.ts',
      },
      {
        description: 'axe-core reports zero serious or critical violations.',
        verified: true,
        method: 'bun run packages/renderer/scripts/v3-axe-gallery.ts',
      },
      { description: 'bun run check exits zero.', verified: true, method: 'bun run check' },
      {
        description: 'bun test exits zero with no regression.',
        verified: true,
        method: 'bun test',
      },
    ],
  },

  'linked-issues': {
    title: 'Linked issues',
    issues: [
      {
        number: 132,
        title: 'Phase 6 — theme calibration + a11y polish',
        url: 'https://github.com/vdmkotai/azri/issues/132',
        status: 'open',
        relation: 'closes',
      },
      {
        number: 118,
        title: 'duplicate-id violations on rendered pages',
        url: 'https://github.com/vdmkotai/azri/issues/118',
        status: 'open',
        relation: 'fixes',
      },
    ],
  },

  'reviewer-guide': {
    title: 'Where to focus the review',
    priorities: [
      {
        rank: 1,
        area: 'Section renderers',
        what_to_check:
          'Confirm every render.ts now emits a div wrapper without an id attribute on the outer element.',
        files: [
          'packages/core/src/sections/tldr/render.ts',
          'packages/core/src/sections/stack-grid/render.ts',
        ],
      },
      {
        rank: 2,
        area: 'Gallery + axe scripts',
        what_to_check:
          'Validate the mock data matches each schema and the axe report writer covers all five themes.',
        files: [
          'packages/renderer/scripts/v3-gallery.ts',
          'packages/renderer/scripts/v3-axe-gallery.ts',
        ],
      },
    ],
  },

  'rollback-plan': {
    title: 'Rollback plan',
    complexity: 'simple',
    steps: [
      {
        number: 1,
        command: 'git revert <commit-sha>',
        description: 'Revert the gallery + renderer changes.',
      },
      {
        number: 2,
        command: 'bun run check && bun test',
        description: 'Confirm the working tree is clean post-revert.',
      },
    ],
    warnings: ['If the revert lands after a release tag, also yank the npm version.'],
    dataMigration: {
      reversible: true,
      notes: 'No persisted data is touched; the change is purely renderer-side.',
    },
  },
};
