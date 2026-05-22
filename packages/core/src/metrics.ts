// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { currentRequestId } from './context.ts';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

let quietMode = false;
let minLevel: LogLevel = (process.env['AZRI_LOG_LEVEL'] as LogLevel) || 'info';
if (!(minLevel in LEVEL_ORDER)) {
  minLevel = 'info';
}

/** Disable all metric output (for embedded use). */
export function setQuietMetrics(quiet: boolean): void {
  quietMode = quiet;
}

/** Override the minimum log level at runtime. */
export function setLogLevel(level: LogLevel): void {
  if (level in LEVEL_ORDER) {
    minLevel = level;
  }
}

const FORBIDDEN_KEYS = new Set([
  'code',
  'diff',
  'patch',
  'body',
  'content',
  'html',
  'text',
  'fileContent',
  'sourceCode',
]);

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{20,}/gu,
  /ghp_[a-zA-Z0-9]{36,}/gu,
  /github_pat_[a-zA-Z0-9_]{50,}/gu,
];

function redactSecrets(value: string): string {
  let next = value;
  for (const pattern of SECRET_PATTERNS) {
    next = next.replace(pattern, '[REDACTED]');
  }
  return next;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactSecrets(value);
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return sanitizeFields(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeFields(fields: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    output[key] = FORBIDDEN_KEYS.has(key) ? '[FILTERED]' : sanitizeValue(value);
  }

  return output;
}

function emit(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
  if (quietMode) {
    return;
  }

  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) {
    return;
  }

  const requestId = currentRequestId();
  const line: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(requestId ? { requestId } : {}),
    ...sanitizeFields(fields),
  };

  const stream = level === 'warn' || level === 'error' ? process.stderr : process.stdout;
  stream.write(`${JSON.stringify(line)}\n`);
}

export function metricsTrace(event: string, fields?: Record<string, unknown>): void {
  emit('trace', event, fields);
}

export function metricsDebug(event: string, fields?: Record<string, unknown>): void {
  emit('debug', event, fields);
}

export function metricsInfo(event: string, fields?: Record<string, unknown>): void {
  emit('info', event, fields);
}

export function metricsWarn(event: string, fields?: Record<string, unknown>): void {
  emit('warn', event, fields);
}

export function metricsError(event: string, fields?: Record<string, unknown>): void {
  emit('error', event, fields);
}

/**
 * Time an async operation. Emits `<event>.start` and `<event>.end` (with durationMs).
 * On error, emits `<event>.error` with errorMessage and re-throws.
 */
export async function withMetricsSpan<T>(
  event: string,
  fn: () => Promise<T> | T,
  fields?: Record<string, unknown>,
): Promise<T> {
  const start = Date.now();
  metricsInfo(`${event}.start`, fields);

  try {
    const result = await fn();
    metricsInfo(`${event}.end`, { ...fields, durationMs: Date.now() - start });
    return result;
  } catch (error) {
    metricsError(`${event}.error`, {
      ...fields,
      durationMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
