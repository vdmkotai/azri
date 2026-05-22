// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createHash } from 'node:crypto';

import { ENGINE_VERSION, PROMPT_VERSION, type AzriRunInput } from '@azri/types';

export function computeCacheKey(input: AzriRunInput, model: string): string {
  const hash = createHash('sha256');

  hash.update('engine=' + ENGINE_VERSION);
  hash.update('|prompt=' + PROMPT_VERSION);
  hash.update('|model=' + model);
  hash.update('|mode=' + input.mode);
  hash.update('|repo=' + input.repo.owner + '/' + input.repo.name);

  if (input.change) {
    hash.update('|base=' + input.change.baseSha);
    hash.update('|head=' + input.change.headSha);
  } else {
    hash.update('|repo-snapshot=' + input.repo.capturedAt);
  }

  hash.update('|config=' + JSON.stringify(input.config ?? {}));
  return hash.digest('hex');
}
