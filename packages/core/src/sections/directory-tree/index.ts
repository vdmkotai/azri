// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { registerSection } from '../registry.ts';
import type { SectionType } from '../types.ts';
import { buildPrompt } from './prompt.ts';
import { renderSection } from './render.ts';
import { DirectoryTreeDataSchema, type DirectoryTreeData } from './schema.ts';

export {
  DirectoryEntryKindEnum,
  DirectoryEntrySchema,
  DirectoryTreeDataSchema,
  type DirectoryEntry,
  type DirectoryEntryKind,
  type DirectoryTreeData,
} from './schema.ts';

export const directoryTreeSection: SectionType<DirectoryTreeData> = {
  id: 'directory-tree',
  name: 'Directory tree',
  description:
    'Annotated map of the most important paths in the repository. Each entry shows path, folder/file icon (Lucide), and a one-line description. Repo-only.',
  applicableFor: ['repo'],
  schema: DirectoryTreeDataSchema,
  prompt: buildPrompt,
  render: renderSection,
  cost: { tokensIn: 2500, tokensOut: 700 },
};

registerSection(directoryTreeSection);
