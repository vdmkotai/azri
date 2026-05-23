// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import type { SectionInput } from './types.ts';

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
}

export const GLOBAL_PROMPT_GUARD = `You generate JSON matching a strict Zod schema. Output ONLY JSON, no prose.

The rendered HTML uses Tailwind CSS v4 utility classes via the Play CDN.
Available semantic colors: primary, foreground, bg, surface, muted,
muted-foreground, success, warn, danger.
DO NOT include HTML in your output — only structured JSON data.

For Simple Icons slugs, use the exact slug from simpleicons.org (e.g.,
'nextdotjs' for Next.js, 'convex', 'clerk', 'bun', 'vercel', 'react').`;

export function summarizeInputForPrompt(input: SectionInput, maxChars = 6000): string {
  const repo = input.repo;
  const change = input.change;
  const totalFiles = repo.fileTree.length;
  const totalLines = repo.fileTree.reduce((sum, file) => sum + file.lineCount, 0);
  const languages = Object.entries(repo.languages)
    .toSorted(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, bytes]) => `${name} (${bytes} bytes)`);

  const manifestSnippets = Object.entries(repo.packageManifests)
    .slice(0, 6)
    .map(([path, content]) => `--- ${path} ---\n${content.slice(0, 1200)}`)
    .join('\n');

  const readme = repo.readme ? repo.readme.slice(0, 2000) : '(no README)';

  const fileSample = repo.fileTree
    .slice(0, 80)
    .map((file) => `${file.path} (${file.lineCount} lines)`)
    .join('\n');

  const changeSummary = change
    ? `\nChange (${change.files.length} files):\n${change.files
        .slice(0, 30)
        .map((file) => `  ${file.status} ${file.path} (+${file.additions}/-${file.deletions})`)
        .join('\n')}`
    : '';

  const prMeta = change?.prMetadata
    ? `\nPR #${change.prMetadata.number}: ${change.prMetadata.title}\n${change.prMetadata.body.slice(0, 800)}`
    : '';

  const blob = `Mode: ${input.mode}
Repo: ${repo.owner}/${repo.name} (default branch: ${repo.defaultBranch})
File tree size: ${totalFiles} files, ${totalLines} total lines
Top languages: ${languages.join(', ') || '(unknown)'}

README (first 2000 chars):
${readme}

Package manifests (first 6):
${manifestSnippets || '(none)'}

File sample (first 80):
${fileSample}${changeSummary}${prMeta}`;

  return blob.length > maxChars ? `${blob.slice(0, maxChars)}\n…(truncated)` : blob;
}
