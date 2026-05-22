// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { AzriRunInput, AzriRunOutput } from '@azri/types';

export type EvalProvider = 'anthropic' | 'openai' | 'google';

export interface DatasetEntry {
  id: string;
  url: string;
  owner: string;
  repo: string;
  prNumber: number;
  category: 'small' | 'medium' | 'large' | 'weird';
  note?: string;
}

export interface SavedRun {
  dataset: DatasetEntry;
  provider: EvalProvider;
  dryRun: boolean;
  input: AzriRunInput;
  output: AzriRunOutput;
}

export interface DimensionScore {
  score: number;
  value: number | null;
  note?: string;
}

export interface EntryScores {
  id: string;
  category: DatasetEntry['category'];
  dimensions: {
    accuracy: DimensionScore;
    depth: DimensionScore;
    noSlop: DimensionScore;
    visual: DimensionScore;
    readability: DimensionScore;
  };
  overall: number;
  malformed?: boolean;
}

export interface ScoreReport {
  generatedAt: string;
  runDir: string;
  provider: string;
  entries: EntryScores[];
  aggregate: {
    accuracy: number;
    depth: number;
    noSlop: number;
    visual: number;
    readability: number;
    overall: number;
  };
}
