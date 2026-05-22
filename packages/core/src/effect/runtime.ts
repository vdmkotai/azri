// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

import { Effect, Layer, ManagedRuntime } from 'effect';
import { LlmServiceLive } from './layers.ts';

export const baseLayer = Layer.mergeAll(LlmServiceLive);

export type BaseLayer = typeof baseLayer;

export class AzriRuntime {
  private readonly rt: ReturnType<typeof ManagedRuntime.make<never, never>>;

  constructor(
    layer: Layer.Layer<unknown, never> = baseLayer as unknown as Layer.Layer<unknown, never>,
  ) {
    this.rt = ManagedRuntime.make(layer as Layer.Layer<never, never>);
  }

  runPromise<A>(effect: Effect.Effect<A, unknown, never>): Promise<A> {
    return this.rt.runPromise(effect);
  }

  runPromiseExit<A>(effect: Effect.Effect<A, unknown, never>) {
    return this.rt.runPromiseExit(effect);
  }

  async dispose(): Promise<void> {
    await this.rt.dispose();
  }
}
