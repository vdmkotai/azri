// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { afterEach, describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { SectionNotFoundError } from '../../src/sections/errors.ts';
import {
  getManifest,
  getSection,
  listSections,
  registerSection,
  unregisterSection,
} from '../../src/sections/registry.ts';
import type { SectionType } from '../../src/sections/types.ts';

const registered = new Set<string>();

function section(
  id: string,
  applicableFor: readonly ('pr' | 'repo')[] = ['repo'],
): SectionType<{ value: string }> {
  return {
    id,
    name: `Section ${id}`,
    description: `Description for ${id}`,
    applicableFor,
    schema: z.object({ value: z.string() }),
    prompt: () => 'Return JSON.',
    render: (data) => data.value,
    cost: { tokensIn: 1, tokensOut: 1 },
  };
}

afterEach(() => {
  for (const id of registered) unregisterSection(id);
  registered.clear();
});

describe('section registry', () => {
  test('registers and looks up a section', () => {
    registerSection(section('registry-test-a'));
    registered.add('registry-test-a');

    expect(getSection('registry-test-a').name).toBe('Section registry-test-a');
  });

  test('generates mode-filtered manifests', () => {
    registerSection(section('registry-test-repo', ['repo']));
    registerSection(section('registry-test-pr', ['pr']));
    registered.add('registry-test-repo');
    registered.add('registry-test-pr');

    expect(listSections('repo').map((entry) => entry.id)).toContain('registry-test-repo');
    expect(getManifest('pr').map((entry) => entry.id)).toContain('registry-test-pr');
    expect(getManifest('pr').map((entry) => entry.id)).not.toContain('registry-test-repo');
  });

  test('rejects duplicate IDs', () => {
    registerSection(section('registry-test-dupe'));
    registered.add('registry-test-dupe');

    expect(() => registerSection(section('registry-test-dupe'))).toThrow('Duplicate section id');
  });

  test('throws typed error for missing section', () => {
    expect(() => getSection('registry-test-missing')).toThrow(SectionNotFoundError);
  });
});
