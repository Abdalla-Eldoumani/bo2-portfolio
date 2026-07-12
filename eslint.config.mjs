import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat presets, so no FlatCompat/eslintrc shim
// is needed. `next lint` was removed in Next 16; `eslint .` resolves this file.
const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  // Pin the React version so eslint-plugin-react skips its auto-detect path.
  // The bundled plugin's detector calls the removed context.getFilename(),
  // which throws under ESLint 10; a concrete version bypasses that call.
  { settings: { react: { version: "19.2.7" } } },
  globalIgnores([".*/", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
