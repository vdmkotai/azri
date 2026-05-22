// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Azri contributors

/** Engine version — bumped on breaking changes to AzriRunInput/Output shape or pipeline behavior. Used in cache keys. */
export const ENGINE_VERSION = '0.1.0' as const;

/** Prompt version — bumped on deliberate prompt changes. Busts the run cache. */
export const PROMPT_VERSION = 'v1' as const;
