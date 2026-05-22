// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { expectEscaped, XSS } from './_test-utils.ts';
import { StickyTOC } from './sticky-toc.ts';

describe('StickyTOC', () => {
  const schema = z.object({ sections: z.array(z.object({ id: z.string(), title: z.string() })) });

  test('escapes section IDs and titles', () =>
    expectEscaped(StickyTOC({ sections: [{ id: XSS, title: XSS }] })));
  test('props schema validates component inputs', () =>
    expect(schema.parse({ sections: [{ id: 'a', title: 'A' }] }).sections).toHaveLength(1));
  test('output snapshot', () =>
    expect(StickyTOC({ sections: [{ id: 'a', title: 'A' }] })).toMatchSnapshot());
});
