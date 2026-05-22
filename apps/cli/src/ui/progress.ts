// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const FRAME_INTERVAL_MS = 80;

export interface ProgressStage {
  id: string;
  label: string;
}

export interface ProgressHandle {
  start(stageId: string): void;
  advance(stageId: string, note?: string): void;
  complete(stageId: string): void;
  fail(stageId: string, message: string): void;
  done(): void;
}

export interface CreateProgressOptions {
  stages: ReadonlyArray<ProgressStage>;
  enabled?: boolean;
  stream?: NodeJS.WriteStream;
}

function shouldEnable(opts?: CreateProgressOptions): boolean {
  if (opts?.enabled !== undefined) return opts.enabled;
  if (process.env.CI) return false;
  return !!process.stdout.isTTY;
}

export function createProgress(opts: CreateProgressOptions): ProgressHandle {
  const enabled = shouldEnable(opts);
  const stream = opts.stream ?? process.stderr;
  const stages = opts.stages;
  let currentStage: string | null = null;
  let currentNote = '';
  let frameIdx = 0;
  let interval: ReturnType<typeof setInterval> | null = null;

  function clearLine(): void {
    if (!enabled) return;
    stream.write('\u001B[2K\r');
  }

  function render(): void {
    if (!enabled || !currentStage) return;
    const stage = stages.find((item) => item.id === currentStage);
    if (!stage) return;

    const idx = stages.findIndex((item) => item.id === currentStage) + 1;
    const frame = SPINNER_FRAMES[frameIdx]!;
    const note = currentNote ? ` · ${currentNote}` : '';

    clearLine();
    stream.write(`${frame} Stage ${idx}/${stages.length} ${stage.label}${note}`);
    frameIdx = (frameIdx + 1) % SPINNER_FRAMES.length;
  }

  function stopAnimation(): void {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  return {
    start(stageId) {
      stopAnimation();
      currentStage = stageId;
      currentNote = '';
      if (enabled) {
        render();
        interval = setInterval(render, FRAME_INTERVAL_MS);
      }
    },
    advance(stageId, note) {
      if (currentStage !== stageId) return;
      currentNote = note ?? '';
    },
    complete(stageId) {
      if (currentStage !== stageId) return;

      stopAnimation();
      clearLine();
      if (enabled) {
        const stage = stages.find((item) => item.id === stageId);
        const idx = stages.findIndex((item) => item.id === stageId) + 1;
        stream.write(`✓ Stage ${idx}/${stages.length} ${stage?.label ?? stageId}\n`);
      }
      currentStage = null;
      currentNote = '';
    },
    fail(stageId, message) {
      stopAnimation();
      clearLine();
      if (enabled) {
        const stage = stages.find((item) => item.id === stageId);
        stream.write(`✗ ${stage?.label ?? stageId}: ${message}\n`);
      }
      currentStage = null;
      currentNote = '';
    },
    done() {
      stopAnimation();
      clearLine();
    },
  };
}
