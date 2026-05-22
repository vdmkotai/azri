// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { ProviderName } from './registry.ts';

export interface AuthStatus {
  provider: ProviderName;
  envVar: string;
  hasKey: boolean;
}

const ENV_VARS: Record<ProviderName, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
};

export function getAuthStatus(provider: ProviderName): AuthStatus {
  const envVar = ENV_VARS[provider];
  return { provider, envVar, hasKey: !!process.env[envVar] };
}

export function getEnvVarFor(provider: ProviderName): string {
  return ENV_VARS[provider];
}
