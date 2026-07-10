import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { basename } from 'node:path';

// Unit-test config for the data/util layer. Tests run in `node` (no jsdom): the
// code under test is server/pure library code, not DOM components.
export default defineConfig({
  plugins: [
    // Next's webpack/turbopack loader turns an image import into a
    // StaticImageData object ({ src, width, height, blurDataURL }); Vite (which
    // powers Vitest) instead resolves it to a bare URL string. Without this the
    // data layer's `project.image.src` is undefined in tests only, even though
    // the production build yields the object. This `pre` plugin mirrors Next so
    // image-consuming modules present the same shape under test as in the build.
    // The real DATA-03 fail-loud guarantee still lives in `next build` (a
    // missing file breaks the build) and in typecheck (StaticImageData typing);
    // this only lets the runtime smoke test assert that shape.
    {
      name: 'next-static-image-stub',
      enforce: 'pre',
      load(id: string) {
        const file = id.split('?')[0];
        if (!/\.(png|jpe?g|gif|svg|webp|avif)$/.test(file)) return null;
        const src = `/${basename(file)}`;
        return `export default ${JSON.stringify({ src, width: 1, height: 1, blurDataURL: src })};`;
      },
    },
  ],
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
