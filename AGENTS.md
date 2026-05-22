# AGENTS.md — Azri operating rules

## Runtime

- Bun >= 1.1.0 only.
- Pin the exact Bun version in `package.json` via `packageManager`.

## Code style

- Use ES modules everywhere.
- Use explicit `.ts` extensions in local imports.
- Prefer small, direct modules over abstraction.

## Stack rules

- Effect: `effect@4.0.0-beta.70` and `Context.Service`.
- HTTP: `effect/unstable/http` + `Bun.serve`; not Elysia.
- Schema: Zod; not `effect/Schema`.
- LLM: Vercel AI SDK v6 wrapped in `Effect.tryPromise` at service boundaries.
- Logger: custom JSON logger with `AsyncLocalStorage`; not pino.
- Linter/formatter: Oxlint + Oxfmt only.
- Testing: `bun test` with `bun:test`.

## Quality gates

- Every `.ts` file must start with the Apache 2.0 SPDX header.
- Use `git commit -s` for DCO sign-off.
- Keep headers and license notices consistent with Apache 2.0.

## Reference repo

- Production reference: `/Users/vkotai/work/libs/better-context`.
- Follow its service/layer/runtime patterns when adding Effect code.

## Commands

| Command                 | Purpose                                |
| ----------------------- | -------------------------------------- |
| `bun run check`         | typecheck + lint + fmt check + headers |
| `bun run test`          | run Bun tests                          |
| `bun run lint`          | run Oxlint                             |
| `bun run lint:fix`      | auto-fix Oxlint issues                 |
| `bun run fmt`           | format with Oxfmt                      |
| `bun run fmt:check`     | verify formatting                      |
| `bun run check:headers` | verify SPDX headers                    |

## Notes

- Apache 2.0 everywhere.
- Keep internal packages private; only `apps/cli` is publishable as `azri`.
