### 2026-05-22
- Added `packages/types/src/version.ts` to the public `@azri/types` barrel so core cache-key code can import version constants cleanly.
- Used `PartitionedSemaphore.makeUnsafe({ permits: 1 })` for `run-mutex` to keep `makeRunMutex()` synchronous and preserve the smoke-test API.
- Kept `delivery-dedup` as a small in-memory TTL map instead of forcing Effect cache semantics onto a boolean dedup problem.
