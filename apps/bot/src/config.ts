// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export type LlmProvider = 'anthropic' | 'openai' | 'google';

export interface BotConfig {
  port: number;
  dataDir: string;
  publicBaseUrl?: string;
  githubAppId?: string;
  githubPrivateKey?: string;
  githubWebhookSecret?: string;
  additionalWebhookSecrets: string[];
  llmProvider: LlmProvider;
  azriSelfBootstrap: boolean;
}

function parseLlmProvider(value: string | undefined): LlmProvider {
  if (value === 'openai' || value === 'google' || value === 'anthropic') {
    return value;
  }
  return 'anthropic';
}

export function loadBotConfig(): BotConfig {
  const rawPort = Number(process.env['PORT'] ?? '3000');
  const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 3000;

  const additionalWebhookSecrets = (process.env['GITHUB_WEBHOOK_ADDITIONAL_SECRETS'] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const config: BotConfig = {
    port,
    dataDir: process.env['AZRI_DATA_DIR'] ?? './pages-data',
    additionalWebhookSecrets,
    llmProvider: parseLlmProvider(process.env['AZRI_LLM_PROVIDER']),
    azriSelfBootstrap: process.env['AZRI_SELF_BOOTSTRAP'] === 'true',
  };

  const publicBaseUrl = process.env['AZRI_PUBLIC_BASE_URL'];
  if (publicBaseUrl) config.publicBaseUrl = publicBaseUrl;

  const githubAppId = process.env['GITHUB_APP_ID'];
  if (githubAppId) config.githubAppId = githubAppId;

  const githubPrivateKey = process.env['GITHUB_PRIVATE_KEY'];
  if (githubPrivateKey) config.githubPrivateKey = githubPrivateKey;

  const githubWebhookSecret = process.env['GITHUB_WEBHOOK_SECRET'];
  if (githubWebhookSecret) config.githubWebhookSecret = githubWebhookSecret;

  return config;
}
