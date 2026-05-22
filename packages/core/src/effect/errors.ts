// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export interface TaggedErrorOptions {
  message?: string;
  hint?: string;
  cause?: unknown;
}

export class AzriError extends Error {
  readonly tag: string = 'AzriError';
  readonly hint?: string;
  override readonly cause?: unknown;

  constructor(tag: string, opts: TaggedErrorOptions = {}) {
    super(opts.message ?? tag);
    (this as { tag: string }).tag = tag;
    if (opts.hint) this.hint = opts.hint;
    if (opts.cause !== undefined) this.cause = opts.cause;
    this.name = tag;
  }
}

export class LlmProviderError extends AzriError {
  constructor(opts: TaggedErrorOptions = {}) {
    super('LlmProviderError', {
      message: opts.message ?? 'LLM provider call failed',
      hint: opts.hint ?? 'Check your API key and provider status page.',
      cause: opts.cause,
    });
  }
}

export class GitHubAuthError extends AzriError {
  constructor(opts: TaggedErrorOptions = {}) {
    super('GitHubAuthError', {
      message: opts.message ?? 'GitHub authentication failed',
      hint:
        opts.hint ?? 'Check GITHUB_APP_ID and GITHUB_PRIVATE_KEY env vars. See docs/OPERATOR.md.',
      cause: opts.cause,
    });
  }
}

const WRAPPER_TAGS = new Set(['Panic', 'UnhandledException', 'Cause']);
const MAX_DEPTH = 12;

export interface ErrorChainNode {
  tag?: string;
  message: string;
  hint?: string;
  raw: unknown;
}

export function getErrorChain(error: unknown): ErrorChainNode[] {
  const chain: ErrorChainNode[] = [];
  let current: unknown = error;
  for (let i = 0; i < MAX_DEPTH && current; i++) {
    if (current instanceof Error) {
      const tag = (current as Error & { tag?: string }).tag;
      const hint = (current as Error & { hint?: string }).hint;
      chain.push({
        ...(tag ? { tag } : {}),
        message: current.message,
        ...(hint ? { hint } : {}),
        raw: current,
      });
      current = (current as Error & { cause?: unknown }).cause;
    } else {
      chain.push({ message: String(current), raw: current });
      break;
    }
  }
  return chain;
}

/** Find the deepest hint in the error chain, skipping wrapper errors. */
export function deepestHint(error: unknown): string | undefined {
  const chain = getErrorChain(error);
  for (let i = chain.length - 1; i >= 0; i--) {
    const node = chain[i]!;
    if (node.hint && (!node.tag || !WRAPPER_TAGS.has(node.tag))) return node.hint;
  }
  return undefined;
}
