// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export function swatch(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return '\u25A0';
  return `\u001B[38;2;${r};${g};${b}m\u25A0\u001B[0m`;
}

export function swatchRow(colors: readonly string[]): string {
  return colors.map((c) => swatch(c)).join(' ');
}
