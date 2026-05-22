// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import {
  makeFile,
  makePrInput,
  stage0Deps,
} from '../../packages/core/src/pipeline/_test-fixtures.ts';
import { runStage0 } from '../../packages/core/src/pipeline/stage-0-fetch-triage.ts';
import type { ChangedFile } from '../../packages/types/src/index.ts';

export { makeFile, makePrInput, stage0Deps };

export async function runFiles(files: ChangedFile[]) {
  return runStage0(makePrInput(files), stage0Deps());
}
