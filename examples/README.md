# Azri example pages

Three reference HTML pages produced by the v0.3 renderer from Section Registry
mock inputs. They serve two purposes:

1. **Aesthetic north star** — regression baselines for future renderer changes.
   Tweak the renderer, regenerate, and check the diff makes sense.
2. **README/demo assets** — what an Azri-generated page looks like when the
   inputs are good.

The section inputs are hand-authored mocks, not LLM-generated. Each one is built
to look like a real PR or repo from a popular OSS project and to exercise a
different slice of the renderer's 37-section surface.

| File                 | Mode | Sections | Risks | Diagram | Purpose                                                              |
| -------------------- | ---- | -------- | ----- | ------- | -------------------------------------------------------------------- |
| `pr-explainer.html`  | PR   | 5        | yes   | no      | Medium PR using summary, diff, test, and reviewer sections.          |
| `repo-overview.html` | repo | 5        | no    | no      | Small repo overview using project, stack, files, and tree sections.  |
| `big-pr.html`        | PR   | 7        | yes   | yes     | Larger PR using architecture, data-flow, risk, and rollout sections. |

## Layout

For each example, three files live in this directory:

- `<name>.plan.json` — legacy v0.2 source kept only as historical fixture data.
- `<name>.<diagram-id>.svg` — legacy pre-rendered SVG, if any.
- `<name>.html` — the rendered v0.3 output. It loads Tailwind v4, Mermaid, Lucide, and Simple Icons from CDNs.

The generator now uses `packages/renderer/scripts/v3-gallery-mocks.ts`, so the
HTML examples track the same section mocks used by the v3 gallery.

## Regenerating

From the repo root:

```bash
bun examples/generate.ts                   # all three
bun examples/generate.ts pr-explainer      # just one
```

No LLM calls are made; regeneration is local and cheap.

## What to look for visually

When evaluating a renderer change against these baselines:

- **Header weight** — large serif title, smaller dek, monospace meta line. The
  title should breathe; no cramped wrapping.
- **TOC rail** — sticky on desktop, sits flush against a thin rule. The numbered
  list uses mono font; the section titles use serif.
- **Section variety** — each page should look composed from distinct section
  renderers, not repeated markdown cards.
- **Risk callouts** — each callout has visible severity treatment and a clear
  suggestion or mitigation.
- **Mermaid diagrams** — render client-side through Mermaid Tiny when a
  `mermaid-diagram` or flow section is present.
- **CDN styling** — pages should include the v0.3 CSP and Tailwind v4 CDN setup.

## Anti-slop discipline

The hand-authored prose deliberately avoids the engine's anti-slop blocklist:
no _robust_, _seamless_, _leverage_, _utilize_, _moreover_, _furthermore_,
_this PR introduces_, _let's dive into_. If you edit a plan, run:

```bash
grep -ciE '\b(robust|seamless|leverage|utilize|moreover|furthermore)\b|this PR introduces|let.s dive into' examples/*.html
```

The output must be `0` for every file.

## Apache 2.0

Same as the rest of the repo.
