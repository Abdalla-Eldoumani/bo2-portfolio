import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Unit-test config for the data/util layer. Tests run in `node` (no jsdom): the
// code under test is server/pure library code, not DOM components.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    alias: {
      // Neutralize the RSC-only guard so a `import 'server-only'` module can be
      // imported under node without throwing. Test-scope only; the production
      // build keeps the real guard.
      'server-only': fileURLToPath(new URL('./test/stubs/empty.ts', import.meta.url)),
    },
  },
  resolve: {
    // Mirror the tsconfig path mapping `{ "@/*": ["./*"] }` so imports resolve
    // identically in tests and in the app build.
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
