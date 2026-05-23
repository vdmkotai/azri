// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { swatch, swatchRow } from '../src/ui/swatch.ts';

describe('swatch', () => {
  test('renders truecolor ANSI for known hex', () => {
    expect(swatch('#000000')).toBe('\u001B[38;2;0;0;0m\u25A0\u001B[0m');
    expect(swatch('#ffffff')).toBe('\u001B[38;2;255;255;255m\u25A0\u001B[0m');
    expect(swatch('#2b6cb0')).toBe('\u001B[38;2;43;108;176m\u25A0\u001B[0m');
  });

  test('falls back to plain block for malformed hex', () => {
    expect(swatch('#zzzzzz')).toBe('\u25A0');
    expect(swatch('not-a-color')).toBe('\u25A0');
  });
});

describe('swatchRow', () => {
  test('joins multiple swatches with single spaces', () => {
    const row = swatchRow(['#000000', '#ffffff']);
    expect(row).toBe(`\u001B[38;2;0;0;0m\u25A0\u001B[0m \u001B[38;2;255;255;255m\u25A0\u001B[0m`);
  });

  test('handles empty input', () => {
    expect(swatchRow([])).toBe('');
  });
});
