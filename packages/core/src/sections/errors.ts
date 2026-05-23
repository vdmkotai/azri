// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

export class SectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Section not found: ${id}`);
    this.name = 'SectionNotFoundError';
  }
}

export class SectionValidationError extends Error {
  constructor(id: string, message: string) {
    super(`Section validation failed: ${id}: ${message}`);
    this.name = 'SectionValidationError';
  }
}

export class SectionProductionError extends Error {
  constructor(id: string, message: string) {
    super(`Section production failed: ${id}: ${message}`);
    this.name = 'SectionProductionError';
  }
}
