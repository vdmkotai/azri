// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export const CHECK_NAME = 'Azri preview';

export type CheckConclusion = 'success' | 'failure' | 'neutral' | 'skipped' | 'cancelled';

export interface CheckRunOctokit {
  rest: {
    checks: {
      create: (params: {
        owner: string;
        repo: string;
        name: string;
        head_sha: string;
        status: 'in_progress';
        started_at: string;
      }) => Promise<{ data: { id: number } }>;
      update: (params: {
        owner: string;
        repo: string;
        check_run_id: number;
        status: 'completed';
        conclusion: CheckConclusion;
        completed_at: string;
        output: { title: string; summary: string };
        details_url?: string;
      }) => Promise<{ data: { id: number } }>;
    };
  };
}

export interface UpdateCheckRunOptions {
  conclusion: CheckConclusion;
  title: string;
  summary: string;
  detailsUrl?: string;
}

export async function createCheckRun(
  octokit: CheckRunOctokit,
  owner: string,
  repo: string,
  headSha: string,
): Promise<{ id: number }> {
  const r = await octokit.rest.checks.create({
    owner,
    repo,
    name: CHECK_NAME,
    head_sha: headSha,
    status: 'in_progress',
    started_at: new Date().toISOString(),
  });
  return { id: r.data.id };
}

export async function updateCheckRun(
  octokit: CheckRunOctokit,
  owner: string,
  repo: string,
  checkRunId: number,
  opts: UpdateCheckRunOptions,
): Promise<void> {
  await octokit.rest.checks.update({
    owner,
    repo,
    check_run_id: checkRunId,
    status: 'completed',
    conclusion: opts.conclusion,
    completed_at: new Date().toISOString(),
    output: { title: opts.title, summary: opts.summary },
    ...(opts.detailsUrl ? { details_url: opts.detailsUrl } : {}),
  });
}
