// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { runStage0 } from '../../packages/core/src/pipeline/stage-0-fetch-triage.ts';
import { makeFile, makePrInput, stage0Deps } from './_helpers.ts';

describe('edge: bot PR', () => {
  test('skips bot-authored PRs at Stage 0', async () => {
    const input = makePrInput([makeFile()]);
    input.change!.prMetadata!.user.type = 'Bot';
    const out = await runStage0(input, stage0Deps());
    expect(out.kind).toBe('skip');
    if (out.kind === 'skip') expect(out.reason).toBe('bot-author');
  });

  test.todo('brief-mode path for bot PRs exists once orchestrator stops hard-skipping bots');
});
