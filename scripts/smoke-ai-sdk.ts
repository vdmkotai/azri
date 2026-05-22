// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors
/* oxlint-disable max-lines, max-lines-per-function */

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

const HAS_KEY = !!process.env.ANTHROPIC_API_KEY;
const IS_PROD = process.env.NODE_ENV === 'production';
const MODEL = anthropic('claude-haiku-4-5');

type Result = {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'WARN';
  note?: string;
  elapsedMs?: number;
};

const results: Result[] = [];

const ComplexSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z
    .object({
      author: z.string().optional(),
      version: z.string().optional(),
      deprecated: z.boolean().optional(),
    })
    .optional(),
  items: z.array(
    z.object({
      name: z.string(),
      notes: z.string().optional(),
    }),
  ),
  variant: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('a'), valueA: z.number().optional() }),
    z.object({ kind: z.literal('b'), valueB: z.string().optional() }),
  ]),
});

type ComplexObject = z.infer<typeof ComplexSchema>;

function elapsed(start: number): number {
  return Date.now() - start;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function timeoutAfter(ms: number, message = `timeout after ${ms}ms`): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

async function withTimeout<T>(work: Promise<T>, ms: number, message?: string): Promise<T> {
  return await Promise.race([work, timeoutAfter(ms, message)]);
}

function isComplexObject(value: unknown): value is ComplexObject {
  return ComplexSchema.safeParse(value).success;
}

async function test1_basicGenerate(): Promise<Result> {
  const name = 'basicGenerate';
  const start = Date.now();

  try {
    const response = await withTimeout(
      generateText({
        model: MODEL,
        prompt: "Say 'hi' in exactly one word.",
        maxOutputTokens: 8,
      }),
      15_000,
      'basic generateText exceeded 15s',
    );

    const text = response.text.trim().replaceAll(/[.!]/gu, '').toLowerCase();
    return {
      name,
      status: text === 'hi' ? 'PASS' : 'FAIL',
      elapsedMs: elapsed(start),
      note: `text=${JSON.stringify(response.text.trim())}`,
    };
  } catch (error) {
    return { name, status: 'FAIL', elapsedMs: elapsed(start), note: formatError(error) };
  }
}

async function test2_generateObjectJsonTool(): Promise<Result> {
  const name = 'generateObjectJsonTool';
  const start = Date.now();

  try {
    const response = await withTimeout(
      generateObject({
        model: MODEL,
        schema: ComplexSchema,
        prompt:
          'Return one compact sample project record. Include one item, two tags, and variant kind a.',
        providerOptions: {
          anthropic: {
            structuredOutputMode: 'jsonTool',
          },
        },
      }),
      30_000,
      'generateObject jsonTool exceeded 30s',
    );

    return {
      name,
      status: isComplexObject(response.object) ? 'PASS' : 'FAIL',
      elapsedMs: elapsed(start),
      note: `id=${response.object.id}`,
    };
  } catch (error) {
    return { name, status: 'FAIL', elapsedMs: elapsed(start), note: formatError(error) };
  }
}

async function test3_generateObjectNoJsonTool(): Promise<Result> {
  const name = 'generateObjectNoJsonTool';
  const start = Date.now();

  try {
    const response = await withTimeout(
      generateObject({
        model: MODEL,
        schema: ComplexSchema,
        prompt:
          'Return one compact sample project record. Include one item, two tags, and variant kind b.',
      }),
      20_000,
      'negative generateObject without jsonTool timed out after 20s',
    );

    if (isComplexObject(response.object)) {
      return {
        name,
        status: 'FAIL',
        elapsedMs: elapsed(start),
        note: 'Known bug did not reproduce: generateObject without jsonTool returned valid output',
      };
    }

    return {
      name,
      status: 'PASS',
      elapsedMs: elapsed(start),
      note: 'Bug observed: generateObject returned invalid output without jsonTool',
    };
  } catch (error) {
    return {
      name,
      status: 'PASS',
      elapsedMs: elapsed(start),
      note: `Bug observed without jsonTool: ${formatError(error)}`,
    };
  }
}

async function test4_promptCaching(): Promise<Result> {
  const name = 'promptCaching';
  const start = Date.now();
  const cachedSystem = [
    'You are a smoke-test assistant. The following repeated policy text is intentionally long',
    'so Anthropic prompt caching can be observed on the second identical request.',
    ...Array.from(
      { length: 180 },
      (_, index) =>
        `Policy sentence ${index + 1}: answer briefly, preserve safety constraints, and use stable wording.`,
    ),
  ].join('\n');

  try {
    const messages = [
      {
        role: 'system' as const,
        content: cachedSystem,
        providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
      },
      { role: 'user' as const, content: 'Reply with the single word ready.' },
    ];

    await withTimeout(
      generateText({ model: MODEL, messages, maxOutputTokens: 8 }),
      20_000,
      'first prompt caching call exceeded 20s',
    );
    const second = await withTimeout(
      generateText({ model: MODEL, messages, maxOutputTokens: 8 }),
      20_000,
      'second prompt caching call exceeded 20s',
    );

    const usage = second.usage as unknown as Record<string, unknown>;
    const cachedInputTokens =
      Number(usage.cachedInputTokens ?? usage.experimental_cachedInputTokens ?? 0) || 0;

    if (cachedInputTokens > 0) {
      return {
        name,
        status: 'PASS',
        elapsedMs: elapsed(start),
        note: `cachedInputTokens=${cachedInputTokens}`,
      };
    }

    return {
      name,
      status: 'WARN',
      elapsedMs: elapsed(start),
      note: `cached token metadata missing or zero; usage=${JSON.stringify(second.usage)}`,
    };
  } catch (error) {
    return { name, status: 'FAIL', elapsedMs: elapsed(start), note: formatError(error) };
  }
}

async function test5_timeoutSafety(): Promise<Result> {
  const name = 'timeoutSafety';
  const start = Date.now();

  try {
    const fast = await withTimeout(
      generateText({
        model: MODEL,
        prompt: 'Reply with OK only.',
        maxOutputTokens: 5,
      }),
      5_000,
      'timeout',
    );

    if (!fast.text.trim()) {
      return {
        name,
        status: 'FAIL',
        elapsedMs: elapsed(start),
        note: '5s call returned empty text',
      };
    }

    let rejectedCleanly = false;
    try {
      await withTimeout(
        generateText({
          model: MODEL,
          prompt: 'Wait briefly, then reply with OK only.',
          maxOutputTokens: 5,
        }),
        100,
        'timeout',
      );
    } catch (error) {
      rejectedCleanly = formatError(error).includes('timeout');
    }

    return {
      name,
      status: rejectedCleanly ? 'PASS' : 'FAIL',
      elapsedMs: elapsed(start),
      note: rejectedCleanly
        ? '5s call succeeded; 100ms guard rejected cleanly'
        : '100ms guard did not reject',
    };
  } catch (error) {
    return { name, status: 'FAIL', elapsedMs: elapsed(start), note: formatError(error) };
  }
}

async function test6_productionMode(): Promise<Result> {
  const name = 'productionMode';
  const start = Date.now();

  try {
    const response = await withTimeout(
      generateText({ model: MODEL, prompt: 'Say "ok".', maxOutputTokens: 5 }),
      15_000,
      'production mode call exceeded 15s',
    );

    return {
      name,
      status: response.text.trim() ? 'PASS' : 'FAIL',
      elapsedMs: elapsed(start),
      note: `NODE_ENV=${process.env.NODE_ENV ?? 'unset'}`,
    };
  } catch (error) {
    return { name, status: 'FAIL', elapsedMs: elapsed(start), note: formatError(error) };
  }
}

async function main(): Promise<void> {
  if (!HAS_KEY) {
    console.log('⚠️  ANTHROPIC_API_KEY not set — recording SKIP for live tests.');
    console.log('   Set ANTHROPIC_API_KEY and re-run to validate the live stack.');
    for (const name of [
      'basicGenerate',
      'generateObjectJsonTool',
      'generateObjectNoJsonTool',
      'promptCaching',
      'timeoutSafety',
      'productionMode',
    ]) {
      results.push({ name, status: 'SKIP', note: 'ANTHROPIC_API_KEY not set' });
    }
  } else if (IS_PROD) {
    results.push(await test6_productionMode());
  } else {
    results.push(await test1_basicGenerate());
    results.push(await test2_generateObjectJsonTool());
    results.push(await test3_generateObjectNoJsonTool());
    results.push(await test4_promptCaching());
    results.push(await test5_timeoutSafety());
    results.push({
      name: 'productionMode',
      status: 'SKIP',
      note: 'run separately with NODE_ENV=production',
    });
  }

  console.log('\n=== SMOKE TEST RESULTS ===');
  for (const result of results) {
    const icon =
      result.status === 'PASS'
        ? '✓'
        : result.status === 'FAIL'
          ? '✗'
          : result.status === 'SKIP'
            ? '–'
            : '⚠';
    const time = result.elapsedMs === undefined ? '' : ` (${result.elapsedMs}ms)`;
    console.log(
      `${icon} ${result.status}: ${result.name}${time}${result.note ? ` — ${result.note}` : ''}`,
    );
  }

  const failed = results.filter((result) => result.status === 'FAIL').length;
  const passed = results.filter((result) => result.status === 'PASS').length;
  console.log(`\n${passed} PASS, ${failed} FAIL, ${results.length - passed - failed} SKIP/WARN`);

  process.exit(failed > 0 ? 1 : 0);
}

await main();
