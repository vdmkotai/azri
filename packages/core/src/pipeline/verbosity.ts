// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { AzriConfig, Verbosity } from '../../../types/src/index.ts';
import { VERBOSITY_CONFIG } from '../../../types/src/index.ts';

export function resolveVerbosity(config: AzriConfig): Verbosity {
  if (config.verbosity) return config.verbosity;
  if (config.brief) return 'concise';
  return 'standard';
}

const WORD_RANGE_RE = /(\d+)-(\d+) words/gu;

function scaleToNearest10(value: number, mult: number): number {
  const scaled = value * mult;
  return Math.max(10, Math.round(scaled / 10) * 10);
}

export function applyVerbosityToPrompt(prompt: string, verb: Verbosity): string {
  const mult = VERBOSITY_CONFIG[verb].wordMult;
  if (mult === 1.0) return prompt;
  return prompt.replace(WORD_RANGE_RE, (_match, lo: string, hi: string) => {
    const newLo = scaleToNearest10(Number(lo), mult);
    const newHi = scaleToNearest10(Number(hi), mult);
    return `${newLo}-${newHi} words`;
  });
}
