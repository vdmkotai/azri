// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createInterface } from 'node:readline/promises';
import type { Verbosity } from '../../../packages/types/src/index.ts';

export const VERBOSITY_LEVELS = ['concise', 'standard', 'detailed'] as const;

export interface VerbosityFlagState {
  verbosity: Verbosity | undefined;
  yes: boolean;
}

export interface VerbosityArgConsumed {
  consumed: boolean;
  advance: number;
  error?: string;
}

function parseVerbosityValue(value: string): Verbosity | { error: string } {
  if ((VERBOSITY_LEVELS as readonly string[]).includes(value)) return value as Verbosity;
  return {
    error: `invalid verbosity '${value}'. Choose: ${VERBOSITY_LEVELS.join(', ')}`,
  };
}

export function consumeVerbosityFlag(
  args: ReadonlyArray<string>,
  index: number,
  state: VerbosityFlagState,
): VerbosityArgConsumed {
  const arg = args[index];
  if (!arg) return { consumed: false, advance: 0 };

  if (arg === '--concise') {
    if (state.verbosity && state.verbosity !== 'concise') {
      return { consumed: true, advance: 0, error: 'conflicting verbosity flags' };
    }
    state.verbosity = 'concise';
    return { consumed: true, advance: 0 };
  }
  if (arg === '--detailed') {
    if (state.verbosity && state.verbosity !== 'detailed') {
      return { consumed: true, advance: 0, error: 'conflicting verbosity flags' };
    }
    state.verbosity = 'detailed';
    return { consumed: true, advance: 0 };
  }
  if (arg === '--yes' || arg === '-y') {
    state.yes = true;
    return { consumed: true, advance: 0 };
  }
  if (arg === '--verbosity') {
    const next = args[index + 1];
    if (next === undefined || next.startsWith('--')) {
      return { consumed: true, advance: 0, error: `missing value for --verbosity` };
    }
    const parsed = parseVerbosityValue(next);
    if (typeof parsed !== 'string') {
      return { consumed: true, advance: 1, error: parsed.error };
    }
    if (state.verbosity && state.verbosity !== parsed) {
      return { consumed: true, advance: 1, error: 'conflicting verbosity flags' };
    }
    state.verbosity = parsed;
    return { consumed: true, advance: 1 };
  }
  if (arg.startsWith('--verbosity=')) {
    const value = arg.slice('--verbosity='.length);
    const parsed = parseVerbosityValue(value);
    if (typeof parsed !== 'string') {
      return { consumed: true, advance: 0, error: parsed.error };
    }
    if (state.verbosity && state.verbosity !== parsed) {
      return { consumed: true, advance: 0, error: 'conflicting verbosity flags' };
    }
    state.verbosity = parsed;
    return { consumed: true, advance: 0 };
  }
  return { consumed: false, advance: 0 };
}

export function shouldPromptForDetailed(verbosity: Verbosity, yes: boolean): boolean {
  if (verbosity !== 'detailed') return false;
  if (yes) return false;
  if (process.env['CI']) return false;
  if (!process.stdout.isTTY) return false;
  return true;
}

export async function confirmDetailed(estimatedUsd: number): Promise<boolean> {
  const cost = `$${estimatedUsd.toFixed(2)}`;
  const message = `Detailed mode uses ~3x tokens (~${cost} estimated). Continue? (y/N) `;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(message);
    return /^y/iu.test(answer.trim());
  } finally {
    rl.close();
  }
}
