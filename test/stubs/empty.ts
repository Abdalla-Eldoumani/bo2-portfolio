// Empty module aliased in place of `server-only` when tests run under Vitest.
// The real `server-only` package throws on import outside a React Server
// Component graph (Vitest's node env is not one), which would break importing
// any server-only module in a test before a single assertion runs. Swapping it
// for this no-op neutralizes that guard for tests only; production keeps the
// real guard. See vitest.config.ts `test.alias`.
export {};
