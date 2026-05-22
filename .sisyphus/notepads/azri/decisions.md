### 2026-05-22
- Added `packages/types/src/version.ts` to the public `@azri/types` barrel so core cache-key code can import version constants cleanly.
- Used `PartitionedSemaphore.makeUnsafe({ permits: 1 })` for `run-mutex` to keep `makeRunMutex()` synchronous and preserve the smoke-test API.
- Kept `delivery-dedup` as a small in-memory TTL map instead of forcing Effect cache semantics onto a boolean dedup problem.

## T18 Stage 2 structure extract - 2026-05-22
- Minimal fallback intentionally has 2 sections even though LLM-generated plans are constrained to 3-7 sections, matching the task fallback smoke test.
- packages/core tsc required replacing Array.toSorted in Stage 0 because the current TS lib target does not include ES2023 array helpers.

## T19 Stage 3 section generation (2026-05-22T16:33:24Z)
- Used `generateText` instead of object generation for prose and limited raw diff hunks to annotated-diff sections only.
- Repo-mode annotated-diff leaks are treated as per-section failures with unsupported placeholder prose rather than throwing.

## T23 Mermaid SSR (2026-05-22)
- Use `Map<string, string>` keyed by `sha256(source)` for in-process cache, not `Cache.make` — pure pre-render utility, no Effect dependency injection. Future stage that composes diagrams can layer Effect on top.
- Lazy module-level promise pattern `let mermaidRendererPromise: Promise<MermaidRenderer|null>|null` so cold start happens at first non-disabled call and the browser is reused across calls in the same process (mermaid-isomorphic internally pools the browser instance).
- Auto-select uses a 4-way regex switch in priority order: schema/migration ➜ ER, API/protocol ➜ sequence, class/interface ➜ class, else ➜ flow. Per task contract: no ML/LLM here. Heuristic input is `title + files + packet summaries + risk signals`.
- Renderer always returns a string (`<svg>` either real or fallback); never throws. This is intentional so Stage 5 HTML rendering can always inline the result.

## T35 CLI progress UI + browser opener (2026-05-22)
- Kept the progress indicator hand-rolled with ANSI control codes and a short frame interval instead of introducing a UI framework.
- Chose `stderr` for progress output so `stdout` stays available for JSON/log pipelines.
- Browser opener skips in CI and supports a `dryRun` flag so tests can exercise command selection without launching anything.

- T46: added `apps/bot/src/self-bootstrap.ts` as a tiny repo gate helper and exported `validateAzriConfig` from `@azri/types` so the bot can validate the committed `.azri/config.json` without duplicating schema logic.
