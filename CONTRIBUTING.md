# Contributing to Azri

Azri is licensed under [Apache 2.0](LICENSE). Contributions are welcome via pull request.

No CLA. DCO sign-off required (see [Sign-off](#sign-off)).

---

## Table of contents

- [Setup](#setup)
- [Running locally](#running-locally)
- [Architecture overview](#architecture-overview)
- [How to add a renderer component](#how-to-add-a-renderer-component)
- [How to add a section type](#how-to-add-a-section-type)
- [How to add an LLM adapter](#how-to-add-an-llm-adapter)
- [Payments](#payments)
- [Running the eval harness](#running-the-eval-harness)
- [Sign-off](#sign-off)
- [Code of Conduct](#code-of-conduct)

---

## Setup

**Requirements:** Bun >= 1.1.0. Install from [bun.sh](https://bun.sh).

```sh
git clone https://github.com/your-org/azri.git
cd azri
bun install
```

Copy the environment template and fill in the required values:

```sh
cp .env.example .env
# Edit .env — at minimum set GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET,
# and one of ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY.
```

Run the full quality gate:

```sh
bun run check   # typecheck + lint + fmt check + SPDX header check
bun test        # unit tests
```

Both must exit 0 before you open a PR.

---

## Running locally

### CLI

```sh
bun run apps/cli/src/cli.ts --help
bun run apps/cli/src/cli.ts report --repo /path/to/some/repo --dry-run
bun run apps/cli/src/cli.ts pr 42 --repo owner/name --dry-run
```

### Bot (webhook server)

The bot needs a public HTTPS URL so GitHub can deliver webhooks. Use [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) or [ngrok](https://ngrok.com) to tunnel your local port.

**With cloudflared (free, no account needed for quick tunnels):**

```sh
# Terminal 1 — start the bot
bun run apps/bot/src/server.ts

# Terminal 2 — open a tunnel to port 3000
cloudflared tunnel --url http://localhost:3000
# Cloudflared prints a URL like https://random-words.trycloudflare.com
```

**With ngrok:**

```sh
# Terminal 1
bun run apps/bot/src/server.ts

# Terminal 2
ngrok http 3000
# ngrok prints a URL like https://abc123.ngrok-free.app
```

Set the tunnel URL as your GitHub App's webhook URL (see [docs/OPERATOR.md](docs/OPERATOR.md) for GitHub App setup). Set `GITHUB_WEBHOOK_SECRET` in `.env` to match the secret you configured in the App.

---

## Architecture overview

Azri processes a PR or repo through a **6-stage pipeline**:

| Stage | Name           | Timeout | What it does                                               |
| ----- | -------------- | ------- | ---------------------------------------------------------- |
| 0     | Fetch & triage | 10 s    | Fetch diff/snapshot, filter generated files, check cache   |
| 1     | Summarize      | 60 s    | Per-file summaries via cheap-tier LLM                      |
| 2     | Structure      | 90 s    | Generate `ExplainerPlan` (section list + evidence mapping) |
| 3     | Write          | 120 s   | Generate prose for each section in parallel batches        |
| 4     | Render         | 10 s    | Assemble HTML from renderer components                     |
| 5     | Publish        | 10 s    | Write to hosting adapter, post sticky comment              |

Total budget: 5 minutes.

**8 locked renderer components** (v1):

`header`, `sticky-toc`, `section`, `callout`, `code-block`, `annotated-diff`, `mermaid-diagram`, `citation-footnote`

**7 section types** (v1):

`summary`, `architecture`, `risk`, `annotated-diff`, `test-impact`, `performance`, `security`

**7 risk categories** (v1):

`security`, `data-loss`, `performance`, `correctness`, `api-contract`, `dependency`, `configuration`

---

## How to add a renderer component

**v1 locks the component set at 8.** This is intentional: the design system, CSS budget, and HTML structure were co-designed for exactly these components. Adding a ninth changes the visual contract for all existing pages.

To propose a new component:

1. Open an issue describing the use case and why none of the 8 existing components cover it.
2. Get explicit sign-off from a maintainer before writing any code.
3. Submit a PR that includes: the component implementation, updated snapshot tests, design-system token usage, and an update to this section of CONTRIBUTING.md.

The PR will go through design review in addition to code review.

**Implementation rules for any component:**

- Pure function: `(props: YourProps) => string`
- No framework dependencies (no React, Vue, Solid, Tailwind, emotion, styled-components)
- Call `escapeHtml()` on every user-controlled string
- Live in `packages/renderer/src/components/`
- Export from `packages/renderer/src/index.ts`
- Include a snapshot test in `packages/renderer/src/components/__snapshots__/`

---

## How to add a section type

**v1 locks section types at 7.** Same policy as renderer components: open an issue first, get maintainer sign-off, then submit a PR.

A new section type requires changes in at least four places:

1. `packages/types/src/types.ts` — add to the `SectionType` union
2. `packages/core/src/prompts/` — add a system prompt file
3. `packages/core/src/pipeline/stage-2-structure.ts` — update the Zod schema
4. `packages/renderer/src/components/section.ts` — handle the new type in the renderer

All four must land in the same PR.

---

## How to add an LLM adapter

LLM adapters live in `packages/adapters/` and implement the `LlmAdapter` interface from `packages/core/src/adapters/llm.ts`.

The three existing implementations are the reference:

- `packages/adapters/llm-anthropic/` — Anthropic Claude via `@ai-sdk/anthropic`
- `packages/adapters/llm-openai/` — OpenAI via `@ai-sdk/openai` (in `packages/core/src/providers/`)
- `packages/adapters/llm-google/` — Google Gemini via `@ai-sdk/google` (in `packages/core/src/providers/`)

**Interface contract:**

```typescript
interface LlmAdapter {
  // Cheap-tier model for Stage 1 (per-file summaries)
  cheapModel(): LanguageModel;
  // Reasoning-tier model for Stage 3 (section prose)
  reasoningModel(): LanguageModel;
  // Provider name for logging and cost estimates
  provider: 'anthropic' | 'openai' | 'google';
}
```

`LanguageModel` is the Vercel AI SDK v6 type from `ai`. Wrap any async calls in `Effect.tryPromise` at the service boundary, not inside the adapter itself.

To add a new adapter:

1. Create `packages/adapters/llm-<name>/` with `package.json` (`"private": true`), `tsconfig.json`, and `src/index.ts`.
2. Implement `LlmAdapter`.
3. Register the provider in `packages/core/src/providers/registry.ts`.
4. Add `AZRI_LLM_PROVIDER=<name>` as a valid value in `packages/core/src/config.ts` and `.env.example`.
5. Add cost-estimate constants in `packages/core/src/cost-estimate.ts`.

---

## Payments

PaymentsAdapter is **not in v1**. It's deferred to v2. Do not add payment-related code, env vars, or interfaces in v1 PRs. See the v2 roadmap (link TBD) for the planned design.

---

## Running the eval harness

The eval harness runs the full pipeline against a set of fixture PRs and scores the output.

```sh
bun run eval:run --limit 3
```

This runs 3 fixtures and prints a score table. Omit `--limit` to run all fixtures (slower, costs real LLM tokens). Set `ANTHROPIC_API_KEY` (or the relevant provider key) before running.

Fixtures live in `evals/fixtures/`. To add a fixture, copy an existing one and update the JSON metadata.

---

## Sign-off

All commits must include a DCO sign-off:

```sh
git commit -s -m "your message"
```

The `-s` flag appends `Signed-off-by: Your Name <your@email.com>` to the commit message. This certifies that you wrote the code or have the right to submit it under the Apache 2.0 license. See [developercertificate.org](https://developercertificate.org) for the full text.

Do not use `--no-verify` to bypass the pre-commit hook.

---

## Code of Conduct

This project follows the [Contributor Covenant 2.1](docs/CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.
