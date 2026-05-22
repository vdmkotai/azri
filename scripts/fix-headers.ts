// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { Glob } from 'bun';

const HEADER = `// SPDX-License-Identifier: Apache-2.0
// Copyright (c) ${new Date().getFullYear()} Azri contributors
`;
const HEADER_RE =
  /^\/\/ SPDX-License-Identifier: Apache-2\.0\n\/\/ Copyright \(c\) \d{4} Azri contributors\n/u;

const glob = new Glob('{packages,apps,scripts,evals}/**/*.ts');
let fixed = 0;

for await (const path of glob.scan('.')) {
  if (path.includes('node_modules') || path.includes('dist/')) continue;
  const content = await Bun.file(path).text();
  if (!HEADER_RE.test(content)) {
    await Bun.write(path, HEADER + '\n' + content);
    console.log(`Fixed: ${path}`);
    fixed++;
  }
}

console.log(`\nFixed ${fixed} file(s).`);
