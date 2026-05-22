// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { metricsInfo, metricsWarn } from '@azri/core';
import { App } from '@octokit/app';
import { loadBotConfig } from '../config.ts';

class GitHubAppConfigError extends Error {
  readonly _tag = 'GitHubAppConfigError';
  readonly hint: string;

  constructor(message: string, hint: string) {
    super(message);
    this.hint = hint;
    this.name = 'GitHubAppConfigError';
  }
}

type GitHubApp = App & {
  getSignedJsonWebToken: () => Promise<string>;
};

let cachedGitHubApp: GitHubApp | null = null;
let cachedGitHubAppCreationError: Error | null = null;

type InstallationOctokit = App['octokit'];

function assertToken(authentication: unknown): string {
  if (
    typeof authentication === 'object' &&
    authentication !== null &&
    'token' in authentication &&
    typeof authentication.token === 'string'
  ) {
    return authentication.token;
  }

  throw new Error('GitHub App auth did not return a JWT token');
}

/**
 * Validates env-var PRESENCE only (does NOT parse PEM). Throws friendly error if missing.
 * Safe to call at boot.
 */
export function verifyConfig(): void {
  const cfg = loadBotConfig();
  const missing: string[] = [];

  if (!cfg.githubAppId) missing.push('GITHUB_APP_ID');
  if (!cfg.githubPrivateKey) missing.push('GITHUB_PRIVATE_KEY');
  if (!cfg.githubWebhookSecret) missing.push('GITHUB_WEBHOOK_SECRET');

  if (missing.length > 0) {
    throw new GitHubAppConfigError(
      `Missing required env vars: ${missing.join(', ')}`,
      'Set these in your environment. See docs/OPERATOR.md for the full env var list.',
    );
  }
}

/**
 * Lazy-creates the App. PEM parsed on first call.
 * If creation fails, caches the error and returns null on subsequent calls.
 */
export function createGitHubApp(): GitHubApp | null {
  if (cachedGitHubApp) return cachedGitHubApp;
  if (cachedGitHubAppCreationError) return null;

  const cfg = loadBotConfig();
  if (!cfg.githubAppId || !cfg.githubPrivateKey || !cfg.githubWebhookSecret) {
    cachedGitHubAppCreationError = new GitHubAppConfigError(
      'GitHub App env vars missing',
      'GITHUB_APP_ID / GITHUB_PRIVATE_KEY / GITHUB_WEBHOOK_SECRET must be set.',
    );
    metricsWarn('github.app.create.missing-env');
    return null;
  }

  try {
    const additionalSecrets =
      cfg.additionalWebhookSecrets.length > 0 ? cfg.additionalWebhookSecrets : undefined;

    const created = new App({
      appId: cfg.githubAppId,
      privateKey: cfg.githubPrivateKey,
      webhooks: {
        secret: cfg.githubWebhookSecret,
        ...(additionalSecrets ? { additionalSecrets } : {}),
      },
    }) as GitHubApp;
    created.getSignedJsonWebToken = async () => {
      const authentication = await created.octokit.auth({ type: 'app' });
      return assertToken(authentication);
    };

    cachedGitHubApp = created;
    metricsInfo('github.app.created', { appId: cfg.githubAppId });
    return cachedGitHubApp;
  } catch (e) {
    cachedGitHubAppCreationError = e instanceof Error ? e : new Error(String(e));
    metricsWarn('github.app.create.failed', { errorMessage: cachedGitHubAppCreationError.message });
    return null;
  }
}

/**
 * Returns an installation-scoped Octokit client.
 * Returns null if app cannot be created.
 */
export async function getInstallationOctokit(
  installationId: number,
): Promise<InstallationOctokit | null> {
  const installationApp = createGitHubApp();
  if (!installationApp) return null;

  try {
    return await installationApp.getInstallationOctokit(installationId);
  } catch (e) {
    metricsWarn('github.app.installation-octokit.failed', {
      installationId,
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

/** For tests: reset internal cache. */
export function resetGitHubAppForTests(): void {
  cachedGitHubApp = null;
  cachedGitHubAppCreationError = null;
}

export { GitHubAppConfigError, resetGitHubAppForTests as _resetGitHubAppForTests };
