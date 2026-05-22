// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '=': '&#61;',
  '`': '&#96;',
};

export function escapeHtml(s: unknown): string {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"'=`]/gu, (c) => ESC[c]!);
}

export function escapeAttr(s: unknown): string {
  return escapeHtml(s);
}
