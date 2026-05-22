// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { Citation, ExplainerPlan, HtmlBundle } from '../../../types/src/index.ts';
import type { Stage5Deps, Stage5Output, ValidationSources } from './types.ts';

const MAX_PAGE_BYTES = 2 * 1024 * 1024;

function allowedFiles(sources: ValidationSources): Set<string> {
  const out = new Set<string>();
  if (sources.mode === 'pr' && sources.change) {
    for (const f of sources.change.files) out.add(f.path);
  }
  for (const f of sources.repo.fileTree) out.add(f.path);
  return out;
}

function validateCitation(c: Citation, allowed: Set<string>): string | null {
  if (!allowed.has(c.file)) return `hallucinated file: ${c.file}`;
  if (c.lineStart < 1) return `invalid lineStart for ${c.file}: ${c.lineStart}`;
  if (c.lineEnd < c.lineStart) {
    return `invalid lineRange for ${c.file}: ${c.lineStart}-${c.lineEnd}`;
  }
  return null;
}

function allCitationsIn(plan: ExplainerPlan): Citation[] {
  return plan.risks.flatMap((r) => r.citations);
}

export async function runStage5(
  bundle: HtmlBundle,
  plan: ExplainerPlan,
  sources: ValidationSources,
  deps: Stage5Deps,
): Promise<Stage5Output> {
  const t0 = Date.now();
  const warnings: string[] = [];
  const allowed = allowedFiles(sources);

  let citationsValid = 0;
  let citationsHallucinated = 0;

  for (const c of allCitationsIn(plan)) {
    const err = validateCitation(c, allowed);
    if (err) {
      warnings.push(`Citation validation: ${err}`);
      citationsHallucinated++;
    } else {
      citationsValid++;
    }
  }

  if (!bundle.html.includes('Content-Security-Policy')) {
    warnings.push('Missing Content-Security-Policy meta tag.');
  }
  if (bundle.sizeBytes > MAX_PAGE_BYTES) {
    warnings.push(`Page size ${bundle.sizeBytes} bytes exceeds 2MB cap.`);
  }
  if (!/<!DOCTYPE\s+html>/iu.test(bundle.html)) {
    warnings.push('Missing <!DOCTYPE html>.');
  }
  if (/<script\b[^>]*\bsrc=/iu.test(bundle.html)) {
    warnings.push(
      'Found external <script src=> reference (CSP-forbidden in self-contained output).',
    );
  }

  const durationMs = Date.now() - t0;
  deps.logger.info('stage5.end', {
    citationsValid,
    citationsHallucinated,
    warnings: warnings.length,
    durationMs,
  });

  return { bundle, warnings, citationsValid, citationsHallucinated, durationMs };
}
