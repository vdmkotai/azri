// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { describe, expect, test } from 'bun:test';

import { defaultPresetV3 } from '../../../../renderer/src/design-system/presets-v3/default.ts';
import { renderSection } from './render.ts';

const validData = {
  title: 'What is next',
  recentCommits: [
    {
      sha: 'abcdef1',
      message: 'Add tests',
      author: 'Pat',
      date: '2026-05-24',
    },
  ],
  openPRs: [
    {
      number: 7,
      title: 'Polish visuals',
      status: 'open',
    },
  ],
  plannedWork: [
    {
      title: 'Accessibility audit',
      source: 'v0.3 plan',
    },
  ],
};
const xssData = {
  title: '<img src=x onerror=alert(1)>',
  recentCommits: [
    {
      sha: 'abcdef1',
      message: 'Add tests',
      author: 'Pat',
      date: '2026-05-24',
    },
  ],
  openPRs: [
    {
      number: 7,
      title: 'Polish visuals',
      status: 'open',
    },
  ],
  plannedWork: [
    {
      title: 'Accessibility audit',
      source: 'v0.3 plan',
    },
  ],
};

describe('whats-next render', () => {
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
