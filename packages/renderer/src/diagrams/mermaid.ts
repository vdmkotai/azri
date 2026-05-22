// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { createHash } from 'node:crypto';

export interface MermaidRenderOptions {
  theme?: 'light' | 'dark';
}

interface MermaidRenderResult {
  svg: string;
}

type MermaidRenderer = (diagrams: string[]) => Promise<PromiseSettledResult<MermaidRenderResult>[]>;

const cache = new Map<string, string>();

let mermaidRendererPromise: Promise<MermaidRenderer | null> | null = null;

async function getRenderer(): Promise<MermaidRenderer | null> {
  if (process.env['AZRI_DISABLE_MERMAID'] === 'true') return null;
  if (!mermaidRendererPromise) {
    mermaidRendererPromise = (async () => {
      try {
        const mod = (await import('mermaid-isomorphic')) as {
          createMermaidRenderer?: () => MermaidRenderer;
        };
        const create = mod.createMermaidRenderer;
        if (typeof create === 'function') return create();
        return null;
      } catch {
        return null;
      }
    })();
  }
  return mermaidRendererPromise;
}

const ESCAPE_MAP: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };

function makeFallbackSvg(source: string, reason: string): string {
  const escaped = source.replace(/[<>&]/gu, (c) => ESCAPE_MAP[c] ?? c);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 60" role="img" aria-label="Mermaid fallback"><title>Diagram fallback (${reason})</title><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:monospace;font-size:12px;color:#9c4221;padding:8px;"><strong>Diagram failed to render (${reason}).</strong><pre style="margin:4px 0;white-space:pre-wrap;">${escaped}</pre></div></foreignObject></svg>`;
}

export async function renderMermaidToSvg(
  source: string,
  _opts: MermaidRenderOptions = {},
): Promise<string> {
  const key = createHash('sha256').update(source).digest('hex');
  const cached = cache.get(key);
  if (cached) return cached;

  const renderer = await getRenderer();
  if (!renderer) {
    const fb = makeFallbackSvg(source, 'renderer unavailable');
    cache.set(key, fb);
    return fb;
  }

  try {
    const results = await renderer([source]);
    const r = results[0];
    if (r && r.status === 'fulfilled' && typeof r.value?.svg === 'string') {
      cache.set(key, r.value.svg);
      return r.value.svg;
    }
    const fb = makeFallbackSvg(source, 'parse error');
    cache.set(key, fb);
    return fb;
  } catch {
    const fb = makeFallbackSvg(source, 'render exception');
    cache.set(key, fb);
    return fb;
  }
}

export function clearMermaidCache(): void {
  cache.clear();
}
