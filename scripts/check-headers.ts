// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { Glob } from 'bun';

const HEADER_RE =
  /^\/\/ SPDX-License-Identifier: Apache-2\.0\n\/\/ Copyright \(c\) \d{4} Azri contributors\n/u;

const glob = new Glob('{packages,apps,scripts,evals}/**/*.ts');
const violations: string[] = [];

for await (const path of glob.scan('.')) {
  if (path.includes('node_modules') || path.includes('dist/')) continue;
  const content = await Bun.file(path).text();
  if (!HEADER_RE.test(content)) violations.push(path);
}

if (violations.length > 0) {
  console.error(`Missing Apache-2.0 SPDX header in ${violations.length} file(s):`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log('All source files have valid Apache-2.0 headers.');
