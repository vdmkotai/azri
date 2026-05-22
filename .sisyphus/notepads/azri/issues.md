### 2026-05-22
- `bun run check` initially failed on an unrelated Oxlint complaint in `packages/core/src/pipeline/stage-0-fetch-triage.ts`.
- `oxfmt --check` flagged `packages/core/src/concurrency/delivery-dedup.ts`; formatting the file cleared it.
- During T17, `bun run check` surfaced untracked Stage 2/3 pipeline files with lint warnings; fixed only enough local lint/format state to let the global check pass, but staged only T17 Stage 1 files for commit.

## T19 Stage 3 section generation (2026-05-22T16:33:24Z)
- computeCost returns a CostEstimate object in core; Stage outputs need `.totalUsd` for numeric costUsd.
- zsh reserves `status`; evidence scripts should use another variable name like `exit_code`.

## T23 Mermaid SSR (2026-05-22)
- `bun run check` initially failed on pre-existing untracked code: `packages/renderer/src/components/header.ts` had an `oxlint(no-negated-condition)` warning (`p.runMeta.costUsd !== undefined ? ... : ''`). Flipped to `=== undefined ? '' : ...` to clear the gate without changing behavior.
- `oxfmt --check` then flagged 3 files (one mine: `diagrams/mermaid.ts`; two pre-existing untracked: `components/annotated-diff.ts`, `utils/markdown.ts`). Ran `bun run fmt` which auto-fixed all 3.
- `mermaid-isomorphic` is auto-installing Playwright as a transitive dep but NOT the Chromium browser. Operators must run `bunx playwright install chromium --with-deps` once per environment for real diagram rendering. Documented in `scripts/SMOKE_NOTES.md` under the new "Mermaid SSR (T23)" section.
- Without the env flag and without `chromium` installed, the renderer would still launch and fail at `chromium.launch()` — but our try/catch around the import + the catch around `renderer([...])` ensure fallback SVG comes back. The `AZRI_DISABLE_MERMAID=true` path is the cheap escape hatch for CI/tests that have no browser.
