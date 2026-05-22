// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { $ } from 'bun';

console.log('🧪 Running pre-commit checks...');
try {
  await $`bun run typecheck`.quiet();
  await $`bun run lint`.quiet();
  await $`bun run fmt:check`.quiet();
  await $`bun run check:headers`.quiet();
  console.log('✓ All pre-commit checks passed');
} catch {
  console.error('✗ Pre-commit check failed');
  process.exit(1);
}
