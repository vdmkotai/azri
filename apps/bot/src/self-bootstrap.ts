// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { validateAzriConfig } from '@azri/types';
import type { AzriConfig } from '@azri/types';

const AZRI_REPO_PATTERNS: ReadonlyArray<RegExp> = [/^vkotai\/azri$/iu, /^[^/]+\/azri$/iu];

export interface MinimalRepoIdentity {
  owner: { login: string };
  name: string;
}

export interface MinimalPrPayload {
  repository: MinimalRepoIdentity;
}

export interface MinimalEnv {
  AZRI_SELF_BOOTSTRAP?: string | undefined;
}

export function loadAzriConfig(input: unknown): AzriConfig {
  return validateAzriConfig(input);
}

/**
 * Decides whether to process a PR.
 * - Returns false for azri's OWN repo unless `AZRI_SELF_BOOTSTRAP=true` is set.
 * - Returns true for all other repos.
 */
export function shouldProcessPr(
  payload: MinimalPrPayload,
  env: MinimalEnv = process.env as MinimalEnv,
): boolean {
  const fullName = `${payload.repository.owner.login}/${payload.repository.name}`;
  const isAzriRepo = AZRI_REPO_PATTERNS.some((re) => re.test(fullName));
  if (!isAzriRepo) return true;
  return env.AZRI_SELF_BOOTSTRAP === 'true';
}
