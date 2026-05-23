// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export function printHelp(version: string): void {
  const text = `
azri ${version}
Generate beautiful HTML explainers for PRs and repos. Powered by AI.

USAGE
  azri <command> [options]

COMMANDS
  report           Generate an explainer for the current repository
  pr <num|url>     Generate an explainer for a specific pull request
  diff             Generate an explainer for the local git diff
  auth             Store, inspect, or remove provider API credentials
  doctor           Run local setup diagnostics

GLOBAL OPTIONS
  -h, --help       Show this help message
  -V, --version    Show version
  --config <path>  Path to .azri/config.json (default: ./.azri/config.json)
  --output <path>  Write HTML output to a specific path
  --open           Open the generated HTML in browser
  --verbose        Show per-stage progress
  --json           Print AzriRunOutput JSON to stdout (suppresses pretty CLI)
  --dry-run        Estimate cost without calling the LLM
  --provider <p>   anthropic (default) | openai | gemini
  --verbosity <l>  concise | standard (default) | detailed
  --concise        Shorthand for --verbosity=concise
  --detailed       Shorthand for --verbosity=detailed
  -y, --yes        Skip detailed-mode confirmation prompt

EXAMPLES
  # Whole-repo explainer for the current directory
  azri report --open

  # Explainer for a public pull request
  azri pr https://github.com/effect-ts/effect/pull/4827

  # Use a different LLM provider
  azri report --provider gemini

  # Local diff between two refs
  azri diff --base main --head feature-branch

  # Store a provider API key for future sessions
  azri auth login

  # Check local setup
  azri doctor

ENV
  ANTHROPIC_API_KEY   Anthropic API key (default provider)
  OPENAI_API_KEY      OpenAI API key (when --provider openai)
  GOOGLE_API_KEY      Google API key (when --provider gemini)
  XDG_CONFIG_HOME      Credential file base (default: ~/.config/azri/credentials)
  AZRI_LLM_PROVIDER   Default provider (overridden by --provider flag)
  AZRI_LOG_LEVEL      trace | debug | info | warn | error (default: info)

  Env vars take precedence over stored credentials from azri auth login.

DOCS
  https://github.com/<owner>/azri
`.trim();
  console.log(text);
}
