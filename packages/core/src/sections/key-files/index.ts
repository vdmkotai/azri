// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { KeyFilesDataSchema, type KeyFilesData } from './schema.ts';

export {
  KeyFileEntrySchema,
  KeyFileImportanceEnum,
  KeyFilesDataSchema,
  type KeyFileEntry,
  type KeyFileImportance,
  type KeyFilesData,
} from './schema.ts';

export const keyFilesSection: SectionType<KeyFilesData> = {
  id: 'key-files',
  name: 'Key files',
  description:
    'Ranked numbered list of 3-10 files a new contributor should read first. Each entry has a rank badge, importance pill (entry/critical/reference), the path in mono, and a one-sentence "why first". Repo-only.',
  applicableFor: ['repo'],
  schema: KeyFilesDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2200, tokensOut: 500 },
};

registerSection(keyFilesSection);
