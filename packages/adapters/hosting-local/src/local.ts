// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type {
  HostingAdapter,
  PublishKey,
  PublishResult,
} from '../../../core/src/adapters/hosting.ts';
import { pathForKey } from '../../../core/src/adapters/hosting.ts';
import type { HtmlBundle } from '../../../types/src/index.ts';

export interface LocalHostingOptions {
  baseDir: string;
  publicBaseUrl?: string;
}

export function createLocalHostingAdapter(opts: LocalHostingOptions): HostingAdapter {
  const baseDir = resolve(opts.baseDir);
  const publicBaseUrl = opts.publicBaseUrl?.replace(/\/$/u, '');
  return {
    async publish(bundle: HtmlBundle, key: PublishKey): Promise<PublishResult> {
      const rel = pathForKey(key);
      const fullPath = join(baseDir, rel);
      const tmpPath = `${fullPath}.tmp`;
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(tmpPath, bundle.html, 'utf8');
      await rename(tmpPath, fullPath);
      const url = publicBaseUrl ? `${publicBaseUrl}/${rel}` : `file://${fullPath}`;
      return { url, contentHash: bundle.contentHash };
    },
    getUrl(key: PublishKey): string {
      const rel = pathForKey(key);
      return publicBaseUrl ? `${publicBaseUrl}/${rel}` : `file://${join(baseDir, rel)}`;
    },
  };
}
