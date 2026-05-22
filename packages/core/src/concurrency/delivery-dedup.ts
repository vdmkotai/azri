// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export class DeliveryDedup {
  private readonly seenAt = new Map<string, number>();

  constructor(
    private readonly options: {
      max?: number;
      ttlMs?: number;
    } = {},
  ) {}

  hasSeen(id: string): boolean {
    this.prune();

    if (this.seenAt.has(id)) return true;

    if (this.seenAt.size >= (this.options.max ?? 1000)) {
      const oldest = this.seenAt.keys().next().value;
      if (oldest !== undefined) this.seenAt.delete(oldest);
    }

    this.seenAt.set(id, Date.now());
    return false;
  }

  seen(id: string): boolean {
    return this.hasSeen(id);
  }

  size(): number {
    return this.seenAt.size;
  }

  clear(): void {
    this.seenAt.clear();
  }

  private prune(): void {
    const cutoff = Date.now() - (this.options.ttlMs ?? 24 * 60 * 60 * 1000);
    for (const [id, timestamp] of this.seenAt) {
      if (timestamp < cutoff) {
        this.seenAt.delete(id);
        continue;
      }
      break;
    }
  }
}

export const makeDeliveryDedup = () => new DeliveryDedup();
