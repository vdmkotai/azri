// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { resolve, relative } from 'node:path';
import { Effect } from 'effect';
import { HttpServerResponse } from 'effect/unstable/http';
import { loadBotConfig } from '../config.ts';

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src data: 'self' https://github.com",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'public, max-age=300',
} as const;

const NOT_FOUND_HTML =
  '<!DOCTYPE html><html><head><meta charset=utf-8><title>azri: page not found</title></head><body><h1>404</h1><p>Page not found.</p></body></html>';

function notFound() {
  return HttpServerResponse.text(NOT_FOUND_HTML, {
    status: 404,
    contentType: 'text/html; charset=utf-8',
    headers: SECURITY_HEADERS,
  });
}

export const staticPageHandler = (relPath: string) =>
  Effect.gen(function* () {
    const cfg = loadBotConfig();
    const dataDir = resolve(cfg.dataDir);
    const rRoot = resolve(dataDir, 'r');
    const requested = resolve(rRoot, relPath);

    const rel = relative(rRoot, requested);
    if (rel.startsWith('..') || rel.includes('\0')) {
      return notFound();
    }

    const exists = yield* Effect.promise(() => Bun.file(requested).exists());
    if (!exists) {
      return notFound();
    }

    const body = yield* Effect.tryPromise({
      try: () => Bun.file(requested).text(),
      catch: () => new Error('read-failed'),
    }).pipe(Effect.orElseSucceed(() => null));

    if (body === null) {
      return notFound();
    }

    return HttpServerResponse.text(body, {
      status: 200,
      contentType: 'text/html; charset=utf-8',
      headers: SECURITY_HEADERS,
    });
  });
