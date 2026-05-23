# Azri example pages

Three reference HTML pages produced by `@azri/renderer` from hand-authored
`ExplainerPlan` inputs. They serve two purposes:

1. **Aesthetic north star** — regression baselines for future renderer changes.
   Tweak the renderer, regenerate, and check the diff makes sense.
2. **README/demo assets** — what an Azri-generated page looks like when the
   inputs are good.

The plans are hand-authored, not LLM-generated. Each one is built to look like a
real PR or repo from a popular OSS project and to exercise a different slice of
the renderer's surface (diagrams, callouts, annotated diffs, citations).

| File                 | Mode | Sections | Risks | Diagram | Purpose                                                    |
| -------------------- | ---- | -------- | ----- | ------- | ---------------------------------------------------------- |
| `pr-explainer.html`  | PR   | 7        | 4     | yes     | A medium PR: refactor of an HTTP router (Effect-TS style). |
| `repo-overview.html` | repo | 5        | 4     | yes     | A small, well-structured repo overview (commander.js).     |
| `big-pr.html`        | PR   | 8        | 6     | no      | A larger PR: compatibility shim across runtime + tests.    |

## Layout

For each example, three files live in this directory:

- `<name>.plan.json` — the `ExplainerPlan` source (validated against `ExplainerPlanSchema`).
- `<name>.<diagram-id>.svg` — pre-rendered SVG for the diagram, if any. Embedded into the plan at render time.
- `<name>.html` — the rendered output. Self-contained: all CSS inlined, no external scripts, no fetched stylesheets.

The `.plan.json` and `.svg` files are committed alongside the HTML so the
examples are fully regenerable.

## Regenerating

From the repo root:

```bash
bun examples/generate.ts                   # all three
bun examples/generate.ts pr-explainer      # just one
```

Set `AZRI_DISABLE_MERMAID=true` to skip the mermaid renderer entirely
(useful in CI). The generator already prefers a pre-rendered SVG when one is
checked in next to the plan, so disabling mermaid does not change the output
for these examples.

## What to look for visually

When evaluating a renderer change against these baselines:

- **Header weight** — large serif title, smaller dek, monospace meta line. The
  title should breathe; no cramped wrapping.
- **TOC rail** — sticky on desktop, sits flush against a thin rule. The numbered
  list uses mono font; the section titles use serif.
- **Section dots** — critical sections show a red `●` before the heading,
  important sections show an amber `●`, supporting sections show none. Check
  the colors match the design tokens, not arbitrary CSS.
- **Risk callouts** — each callout has a left border in the severity color, a
  small uppercase mono label (the risk _category_), and prose. Order follows
  `plan.risks` order, not section order.
- **Mermaid diagrams** — sit inside a soft tinted panel with an italic
  caption. If the pre-rendered SVG is missing and mermaid is unavailable,
  the renderer falls back to a small inline diagram with the source as text;
  do **not** commit fallback output to these examples.
- **Citations** — at the bottom of the page, in a monospace ordered list under
  a small uppercase "Citations" heading. Each link points to a GitHub blob
  with `#L<start>-L<end>`.
- **CSP** — every page must contain `default-src 'self'; script-src 'none'`.
  No `<script>` tags anywhere.

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
