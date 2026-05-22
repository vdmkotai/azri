// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { expect } from 'bun:test';

export const XSS = '<img src=x onerror=alert(1)><script>alert(2)</script>';

export function expectEscaped(html: string): void {
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('onerror=');
  expect(html).toContain('&lt;');
}
