// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { parseFlags as parsePrFlags } from '../src/commands/pr-args.ts';
import { parseFlags as parseReportFlags } from '../src/commands/report-args.ts';
import {
  consumeVerbosityFlag,
  shouldPromptForDetailed,
  type VerbosityFlagState,
} from '../src/verbosity-flag.ts';

function runConsume(args: string[]): VerbosityFlagState | { error: string } {
  const state: VerbosityFlagState = { verbosity: undefined, yes: false };
  for (let i = 0; i < args.length; i++) {
    const result = consumeVerbosityFlag(args, i, state);
    if (result.error) return { error: result.error };
    if (result.consumed) i += result.advance;
  }
  return state;
}

describe('consumeVerbosityFlag', () => {
  test('parses --verbosity=concise', () => {
    expect(runConsume(['--verbosity=concise'])).toEqual({ verbosity: 'concise', yes: false });
  });

  test('parses --verbosity standard (space form)', () => {
    expect(runConsume(['--verbosity', 'standard'])).toEqual({
      verbosity: 'standard',
      yes: false,
    });
  });

  test('parses --concise shorthand', () => {
    expect(runConsume(['--concise'])).toEqual({ verbosity: 'concise', yes: false });
  });

  test('parses --detailed shorthand', () => {
    expect(runConsume(['--detailed'])).toEqual({ verbosity: 'detailed', yes: false });
  });

  test('parses --yes and -y to skip prompt', () => {
    expect(runConsume(['--yes'])).toEqual({ verbosity: undefined, yes: true });
    expect(runConsume(['-y'])).toEqual({ verbosity: undefined, yes: true });
  });

  test('rejects invalid verbosity value with helpful message', () => {
    const result = runConsume(['--verbosity=loud']);
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toBe("invalid verbosity 'loud'. Choose: concise, standard, detailed");
    }
  });

  test('rejects conflicting verbosity flags', () => {
    const result = runConsume(['--detailed', '--concise']);
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toBe('conflicting verbosity flags');
    }
  });

  test('rejects missing --verbosity value', () => {
    const result = runConsume(['--verbosity']);
    expect(result).toHaveProperty('error');
  });
});

describe('shouldPromptForDetailed', () => {
  const originalEnv = { ...process.env };
  const originalIsTTY = process.stdout.isTTY;

  test('returns false for non-detailed verbosity', () => {
    expect(shouldPromptForDetailed('concise', false)).toBe(false);
    expect(shouldPromptForDetailed('standard', false)).toBe(false);
  });

  test('returns false when --yes is set', () => {
    expect(shouldPromptForDetailed('detailed', true)).toBe(false);
  });

  test('returns false when CI=1 even if TTY', () => {
    process.env['CI'] = '1';
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    expect(shouldPromptForDetailed('detailed', false)).toBe(false);
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, configurable: true });
  });

  test('returns false when stdout is not a TTY', () => {
    delete process.env['CI'];
    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
    expect(shouldPromptForDetailed('detailed', false)).toBe(false);
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, configurable: true });
  });

  test('returns true when detailed + TTY + no CI + no --yes', () => {
    delete process.env['CI'];
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    expect(shouldPromptForDetailed('detailed', false)).toBe(true);
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, configurable: true });
  });
});

describe('report-args parseFlags integration', () => {
  test('accepts --verbosity=detailed', () => {
    const result = parseReportFlags(['--verbosity=detailed']);
    expect(result).not.toHaveProperty('error');
    if (!('error' in result)) {
      expect(result.verbosity).toBe('detailed');
      expect(result.yes).toBe(false);
    }
  });

  test('accepts --concise + --yes', () => {
    const result = parseReportFlags(['--concise', '--yes']);
    expect(result).not.toHaveProperty('error');
    if (!('error' in result)) {
      expect(result.verbosity).toBe('concise');
      expect(result.yes).toBe(true);
    }
  });

  test('rejects invalid verbosity', () => {
    const result = parseReportFlags(['--verbosity=loud']);
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('invalid verbosity');
    }
  });

  test('default verbosity is undefined (resolves to standard later)', () => {
    const result = parseReportFlags([]);
    expect(result).not.toHaveProperty('error');
    if (!('error' in result)) {
      expect(result.verbosity).toBeUndefined();
    }
  });
});

describe('pr-args parseFlags integration', () => {
  test('accepts --verbosity=concise alongside positional', () => {
    const result = parsePrFlags(['123', '--verbosity=concise', '--repo', 'a/b']);
    expect(result).not.toHaveProperty('error');
    if (!('error' in result)) {
      expect(result.verbosity).toBe('concise');
      expect(result.target).toBe('123');
    }
  });

  test('rejects invalid verbosity value', () => {
    const result = parsePrFlags(['--verbosity=foo']);
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('invalid verbosity');
    }
  });
});
