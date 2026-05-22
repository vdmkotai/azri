# Azri — Inherited Wisdom (read before every task)

## Stack (locked, btca-validated, production-proven)

- **Runtime**: Bun ≥ 1.1.0 (pin exact in `package.json` engines)
- **Effect**: `effect@4.0.0-beta.70` (Effect-TS/effect-smol, NOT the main effect-ts/effect repo which is 3.x)
- **HTTP**: `effect/unstable/http` `HttpRouter` + `Bun.serve` via `HttpRouter.toWebHandler(appLayer)`. NOT Elysia.
- **CLI framework**: `effect/unstable/cli` `Command` + `Flag` + `Argument`. NOT `@effect/cli` (3.x).
- **LLM**: Vercel AI SDK v6 (`ai@^6`) + `@ai-sdk/anthropic` + `@ai-sdk/openai` + `@ai-sdk/google`. NOT `@effect/ai-*` (no Google there). Wrapped in `Effect.tryPromise` at service boundary.
- **Schema**: Zod v3 (NOT `effect/Schema`). btca uses Zod; plugs directly into `ai` SDK's `tool()`.
- **Linter**: Oxlint (`bunx oxlint@latest --deny-warnings`). NOT ESLint.
- **Formatter**: Oxfmt (`bunx oxfmt@latest --check`). NOT Prettier or Biome.
- **Type-check**: `bun tsc --noEmit` (`tsgo` aspirational; preview in late 2025).
- **Task orchestration**: Turbo (build → check → test → format pipeline).
- **GitHub SDK**: `@octokit/app@^16` + `@octokit/webhooks@^14`. Wrap in `Effect.tryPromise`.
- **Diagrams**: Mermaid via `mermaid-isomorphic` (uses Playwright Chromium). Lazy-init via `Effect.acquireRelease`.
- **Logger**: Custom JSON logger + `AsyncLocalStorage` request context (btca pattern). NOT pino.
- **Concurrency**: `Effect.forEach(xs, fn, { concurrency: N })`. NOT `p-limit`.
- **Cache**: `Cache.make({ capacity, timeToLive, lookup })`. NOT `lru-cache`.
- **Mutex**: `PartitionedSemaphore.make<string>({ permits: 1 })`. Fallback: `Map<string, Semaphore>`.
- **Timeout**: `Effect.timeout("30 seconds")`. NOT bare AbortController.
- **Retry**: `Effect.retry(Schedule.exponential("1s").pipe(Schedule.intersect(Schedule.recurs(3))))`.

## Service pattern (4.x beta.70 syntax — beta.20 used ServiceMap.Service)

```typescript
import { Context } from "effect"

export class PipelineService extends Context.Service<PipelineService, PipelineServiceShape>()(
  'azri/effect/PipelineService'
) {}
```

## Effect.tryPromise boundary pattern (btca-derived)

Keep business logic as plain async; wrap ONLY at service boundary.

```typescript
async function runPipelineImpl(args): Promise<Result> { /* plain async/await */ }

const runPipeline: PipelineService['runPipeline'] = (args) =>
  Effect.tryPromise({ try: () => runPipelineImpl(args), catch: (cause) => new PipelineError({ cause }) })
```

## License & headers

- Apache 2.0 throughout
- Every `.ts` source file MUST start with:
  ```
  // SPDX-License-Identifier: Apache-2.0
  // Copyright (c) 2026 Azri contributors
  ```
- Enforced by `scripts/check-headers.ts` + pre-commit hook

## Source reference repos (cloned locally)

- `/Users/vkotai/work/libs/effect-smol` — Effect 4.x source (PRIMARY reference for `effect/unstable/*`, `Context.Service`, `BunHttpServer`)
- `/Users/vkotai/work/libs/effect` — Effect 3.x source (legacy reference)
- `/Users/vkotai/work/libs/better-context` (aka btca) — production reference shipping `effect@4.0.0-beta.20`. STEAL: effect service scaffold (services.ts/layers.ts/runtime.ts), Effect.tryPromise boundary, tagged errors w/ `hint`, custom JSON logger, AsyncLocalStorage requestId, SSE stream w/ pricing metrics, provider registry pattern (`PROVIDER_REGISTRY` Record map), `check-effectification.ts` rg-based guard, AGENTS.md, depot.dev runners, exact tsconfig.

## Monorepo layout

```
packages/{core,renderer,types,adapters/{llm-anthropic,hosting-local}}   ← private: true
apps/{bot,cli}                                                          ← cli is "azri" on npm
scripts/, evals/, examples/, docs/, test/fixtures/
```

## npm publish

- Public package: `azri` (unscoped). v0.0.0 placeholder claimed manually before T1.
- Only `apps/cli` published. Internal packages `private: true`.
- Bin: `{ "azri": "./dist/index.js" }` with `#!/usr/bin/env bun` shebang.
- `bun install -g azri`, `npm install -g azri`, `pnpm add -g azri` all work (Bun must be in PATH at runtime).
- Provenance: `--provenance --access=public` via GitHub Actions OIDC.

## Validated bugs to defensively mitigate (btca-style)

1. `vercel/ai#11503` — `@ai-sdk/anthropic` `generateObject` hangs on complex schemas. Lock `providerOptions.anthropic.structuredOutputMode: 'jsonTool'`.
2. `vercel/ai#15430` — AbortSignal silent hang. Use `Effect.timeout()` (fiber-based).
3. `oven-sh/bun#25630` — `bun build` production streaming break. Deploy via `bun run` only.
4. Octokit raw-body for HMAC: use `effect/unstable/http`'s `HttpServerRequest.text`.

## Deployment

- v1 default: Railway (Docker container, GitHub auto-deploy, ~5 min)
- Alternatives: Fly.io (multi-region), Render (paid tier), self-host VPS
- v1.5 split: bot on Railway/Fly + page serving on Cloudflare R2 + Workers Static Assets
- Deploy command: `bun run apps/bot/src/server.ts` (NOT `bun build`)

## Common conventions

- ES modules everywhere (`"type": "module"` in package.json)
- Local imports use `.ts` extensions: `import { foo } from './bar.ts'`
- `moduleResolution: "bundler"`, `verbatimModuleSyntax: true`
- `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- No path aliases — workspace `workspace:*` only
- DCO sign-off required (`git commit -s`), NOT CLA

---

## Task T1 complete (2026-05-22 19:32:00 +04)

- Bun version pinned: 1.3.14
- Oxlint version: 1.66.0
- Oxfmt version: 0.51.0
- Initial commit SHA: 203db1140f199b4f6eb3f5f3f40454747e7b9310
- Gotchas encountered: `bun tsc` needed a local `typescript` devDependency; `.oxfmtrc.json` needed broader ignore patterns for existing `.sisyphus/` artifacts and `azri-explainer.html`; oxlint regexes needed the `u` flag.
- Files created: 46
