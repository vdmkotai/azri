// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  /** Optional: txDepth for nested transactions / fibers. */
  txDepth?: number;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Generate a short random request ID (URL-safe base36). */
export function newRequestId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Run `fn` with the given request context. Nested calls inherit unless they create a new context. */
export function withRequestContext<T>(
  context: RequestContext,
  fn: () => Promise<T> | T,
): Promise<T> | T {
  return storage.run(context, fn);
}

/** Get the current request ID, or undefined if no context is active. */
export function currentRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

/** Get the full current context, or undefined. */
export function currentContext(): RequestContext | undefined {
  return storage.getStore();
}
