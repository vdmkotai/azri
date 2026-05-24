# azri

AI-powered CLI that turns PRs and repos into beautiful, shareable HTML explainers.

This package ships the `azri` command-line interface. The bot, renderer, and core
pipeline live in the [main Azri repository](https://github.com/vdmkotai/azri).

## Requirements

- [Bun](https://bun.sh) `>= 1.1.0` on your `PATH`. The published binary is a
  Bun-targeted JS bundle with `#!/usr/bin/env bun`, not a standalone executable.

## Install

```sh
bun install -g @vdmkotai/azri
# or pin the current release
bun install -g @vdmkotai/azri@0.3.0
# or
npm install -g @vdmkotai/azri
npm install -g @vdmkotai/azri@0.3.0
# or
pnpm add -g @vdmkotai/azri
pnpm add -g @vdmkotai/azri@0.3.0
```

## Quickstart

Explain a repo (current working directory):

```sh
export ANTHROPIC_API_KEY=sk-ant-...
azri report
```

Explain a single GitHub pull request:

```sh
export GITHUB_TOKEN=ghp_...           # optional for public repos
azri pr https://github.com/owner/repo/pull/123
```

Explain a local diff between two refs:

```sh
azri diff --base main --head HEAD
```

Run `azri --help` for the full command list and `azri <command> --help` for
per-command flags. `azri --version` prints the installed version.

### Provider selection

The CLI supports Anthropic Claude (default), OpenAI, and Google Gemini. Set the
matching env var:

- `ANTHROPIC_API_KEY` — Claude (default provider)
- `OPENAI_API_KEY` — OpenAI
- `GOOGLE_API_KEY` — Gemini

Use `--provider anthropic|openai|google` to pick explicitly, or `--dry-run` to
estimate cost without making any LLM calls.

## Links

- Source, docs, and issue tracker: <https://github.com/vdmkotai/azri>
- Changelog: <https://github.com/vdmkotai/azri/releases>

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
