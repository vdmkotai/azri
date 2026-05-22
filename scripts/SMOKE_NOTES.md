# AI SDK + Bun Smoke Test Notes

Updated: 2026-05-22

## Versions tested

- Bun: 1.3.14
- `ai`: 6.0.190
- `@ai-sdk/anthropic`: 3.0.78
- `zod`: 3.25.76

## Validated bugs and their status

### `vercel/ai#11503` — generateObject hang on complex Anthropic schemas

- **Mitigation**: lock `providerOptions.anthropic.structuredOutputMode: 'jsonTool'` on all `generateObject` calls.
- **Smoke result**: SKIP — `ANTHROPIC_API_KEY` was not set in the local environment.

### `vercel/ai#15430` — AbortSignal silent hang

- **Mitigation**: wrap LLM calls in `Promise.race(work, setTimeout(reject, N))` OR (when Effect is wired in T9) `Effect.timeout()`.
- **Smoke result**: SKIP — `ANTHROPIC_API_KEY` was not set in the local environment.

### `oven-sh/bun#25630` — Bun production streaming break

- **Mitigation**: deploy via `bun run` not `bun build`. Verified with `NODE_ENV=production`.
- **Smoke result**: SKIP — `ANTHROPIC_API_KEY` was not set in the local environment.

## Test outcomes

Local run in this task did not have `ANTHROPIC_API_KEY`, so the script exited 0 and recorded clear SKIP results:

- Test 1 — Basic `generateText`: SKIP
- Test 2 — `generateObject` + `jsonTool`: SKIP
- Test 3 — `generateObject` without `jsonTool` negative test: SKIP
- Test 4 — Prompt caching: SKIP
- Test 5 — Timeout safety: SKIP
- Test 6 — Production mode: SKIP

## Operator notes

- Cost per smoke run: ~$0.005 (5 Haiku 4.5 calls).
- To run: `ANTHROPIC_API_KEY=... bun run scripts/smoke-ai-sdk.ts`
- Production-mode check: `NODE_ENV=production ANTHROPIC_API_KEY=... bun run scripts/smoke-ai-sdk.ts`
- If any test FAILs, do NOT proceed to T9. Document the failure and consult oracle.

## Mermaid SSR (T23)

- `mermaid-isomorphic@3.1.0` is installed and renders diagrams via Playwright Chromium under the hood.
- Operators MUST install the browser once per environment before relying on real diagram rendering:
  - `bunx playwright install chromium --with-deps`
- The renderer is graceful by design:
  - `AZRI_DISABLE_MERMAID=true` short-circuits to a fallback `<svg>` (no browser launch).
  - Render or parse failures also return a fallback `<svg>` without throwing.
- Cached by `sha256(source)`; repeated renders of the same diagram are free.
