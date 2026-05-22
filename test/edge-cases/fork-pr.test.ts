// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { runStage0 } from '../../packages/core/src/pipeline/stage-0-fetch-triage.ts';
import { makeFile, makePrInput, stage0Deps } from './_helpers.ts';

describe('edge: fork PR', () => {
  test('marks fork PR for degraded downstream mode', async () => {
    const input = makePrInput([makeFile()]);
    input.change!.prMetadata!.head.repo.id = 999;
    const out = await runStage0(input, stage0Deps());
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') expect(out.isFromFork).toBe(true);
  });
});
