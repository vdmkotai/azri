// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { chmod, copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const CLI_DIR = resolve(REPO_ROOT, 'apps/cli');
const ENTRY = resolve(CLI_DIR, 'src/cli.ts');
const OUTDIR = resolve(CLI_DIR, 'dist');
const OUTFILE = resolve(OUTDIR, 'index.js');
const PKG_PATH = resolve(CLI_DIR, 'package.json');
const ROOT_LICENSE = resolve(REPO_ROOT, 'LICENSE');
const CLI_LICENSE = resolve(CLI_DIR, 'LICENSE');

const SHEBANG = '#!/usr/bin/env bun\n';

interface CliPackage {
  readonly name?: string;
  readonly version?: string;
}

async function readCliPackage(): Promise<{ name: string; version: string }> {
  const raw = await readFile(PKG_PATH, 'utf8');
  const parsed = JSON.parse(raw) as CliPackage;
  if (typeof parsed.name !== 'string' || parsed.name.length === 0) {
    throw new Error(`[build-cli] missing "name" in ${PKG_PATH}`);
  }
  if (typeof parsed.version !== 'string' || parsed.version.length === 0) {
    throw new Error(`[build-cli] missing "version" in ${PKG_PATH}`);
  }
  return { name: parsed.name, version: parsed.version };
}

const EXTERNAL_DEPS = [
  'mermaid-isomorphic',
  'playwright',
  'playwright-core',
  'playwright-chromium',
] as const;

async function buildBundle(version: string): Promise<string> {
  let result;
  try {
    result = await Bun.build({
      entrypoints: [ENTRY],
      target: 'bun',
      format: 'esm',
      minify: false,
      sourcemap: 'none',
      external: [...EXTERNAL_DEPS],
      define: {
        __AZRI_VERSION__: JSON.stringify(version),
      },
    });
  } catch (cause) {
    console.error('[build-cli] Bun.build threw:');
    console.error(cause instanceof Error ? cause.message : String(cause));
    throw cause;
  }

  if (!result.success) {
    console.error('[build-cli] Bun.build failed:');
    for (const log of result.logs) {
      console.error(`  ${log.message ?? String(log)}`);
    }
    throw new Error('[build-cli] Bun.build reported success=false');
  }

  const [output] = result.outputs;
  if (!output) {
    throw new Error('[build-cli] Bun.build produced no outputs');
  }

  return await output.text();
}

async function verifyArtifact(version: string): Promise<void> {
  const stats = await stat(OUTFILE);
  if (!stats.isFile()) {
    throw new Error(`[build-cli] ${OUTFILE} is not a regular file`);
  }
  const isExec = (stats.mode & 0o111) !== 0;
  if (!isExec) {
    throw new Error(`[build-cli] ${OUTFILE} is not executable (mode ${stats.mode.toString(8)})`);
  }

  const contents = await readFile(OUTFILE, 'utf8');
  const firstLine = contents.split('\n', 1)[0] ?? '';
  if (firstLine !== '#!/usr/bin/env bun') {
    throw new Error(`[build-cli] missing shebang; first line: ${JSON.stringify(firstLine)}`);
  }
  if (!contents.includes(version)) {
    throw new Error(`[build-cli] bundle does not embed version ${version}`);
  }
}

async function syncLicense(): Promise<void> {
  const rootLicenseExists = await Bun.file(ROOT_LICENSE).exists();
  if (!rootLicenseExists) {
    throw new Error(`[build-cli] repo-root LICENSE missing at ${ROOT_LICENSE}`);
  }
  await copyFile(ROOT_LICENSE, CLI_LICENSE);
}

async function main(): Promise<void> {
  const { name, version } = await readCliPackage();
  console.log(`[build-cli] building ${name}@${version}`);
  console.log(`[build-cli]   entry  : ${ENTRY}`);
  console.log(`[build-cli]   outfile: ${OUTFILE}`);

  await rm(OUTDIR, { recursive: true, force: true });
  await mkdir(OUTDIR, { recursive: true });

  const bundled = await buildBundle(version);
  const finalContent = bundled.startsWith(SHEBANG) ? bundled : `${SHEBANG}${bundled}`;
  await writeFile(OUTFILE, finalContent, 'utf8');
  await chmod(OUTFILE, 0o755);
  await syncLicense();

  await verifyArtifact(version);

  const finalStats = await stat(OUTFILE);
  console.log(`[build-cli] ok: ${OUTFILE} (${finalStats.size} bytes, version ${version})`);
  console.log(`[build-cli] ok: synced LICENSE -> ${CLI_LICENSE}`);
}

try {
  await main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
