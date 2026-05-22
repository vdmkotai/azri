// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export interface HtmlBundle {
  html: string;
  sizeBytes: number;
  contentHash: string;
}

export type PublishKey =
  | { kind: 'pr'; owner: string; repo: string; prNumber: number; runId: string }
  | { kind: 'repo'; owner: string; repo: string; runId: string };

export interface PublishResult {
  url: string;
  contentHash: string;
}

export interface HostingAdapter {
  publish(bundle: HtmlBundle, key: PublishKey): Promise<PublishResult>;
  getUrl(key: PublishKey): string;
}

export function pathForKey(key: PublishKey): string {
  if (key.kind === 'pr') {
    return `r/${key.owner}/${key.repo}/pr/${key.prNumber}/${key.runId}.html`;
  }
  return `r/${key.owner}/${key.repo}/repo/${key.runId}.html`;
}
