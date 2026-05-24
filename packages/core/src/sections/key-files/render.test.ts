// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { defaultPresetV3 } from '../../../../renderer/src/design-system/presets-v3/default.ts';
import { renderSection } from './render.ts';

const validData = {
  title: 'Key files',
  files: [
    {
      path: 'src/index.ts',
      importance: 'entry',
      why_first: 'Starts the app.',
    },
    {
      path: 'src/pipeline.ts',
      importance: 'critical',
      why_first: 'Coordinates stages.',
    },
    {
      path: 'src/types.ts',
      importance: 'reference',
      why_first: 'Defines shared types.',
    },
  ],
};
const xssData = {
  title: '<img src=x onerror=alert(1)>',
  files: [
    {
      path: 'src/index.ts',
      importance: 'entry',
      why_first: 'Starts the app.',
    },
    {
      path: 'src/pipeline.ts',
      importance: 'critical',
      why_first: 'Coordinates stages.',
    },
    {
      path: 'src/types.ts',
      importance: 'reference',
      why_first: 'Defines shared types.',
    },
  ],
};

describe('key-files render', () => {
  test('produces valid HTML with semantic theme classes', () => {
    const html = renderSection(validData, defaultPresetV3);

    expect(html).toContain('<section id=');
    expect(html).toContain('text-foreground');
    expect(html).toContain('font-display');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('undefined');
    expect(html).toMatchSnapshot();
  });

  test('escapes HTML in user content', () => {
    const html = renderSection(xssData, defaultPresetV3);

    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img src=x onerror=');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('undefined');
  });
});
