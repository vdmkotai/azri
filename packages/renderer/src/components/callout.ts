// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { escapeHtml } from '../utils/escape-html.ts';

export type CalloutSeverity = 'info' | 'warn' | 'critical';

export interface CalloutProps {
  severity: CalloutSeverity;
  label?: string;
  children: string;
}

export function Callout(p: CalloutProps): string {
  const label = p.label ? `<div class="callout-label">${escapeHtml(p.label)}</div>` : '';
  return `<aside class="azri-callout azri-callout-${p.severity}">${label}<div class="callout-body">${p.children}</div></aside>`;
}
