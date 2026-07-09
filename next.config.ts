import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this project so Turbopack does not infer it from a
  // lockfile higher up the tree, which would emit a wrong-root warning.
  turbopack: {
    root: __dirname,
  },
  // GitHub data uses Model B: pages render statically at build time and each
  // GitHub fetch sets its own revalidate window at the data layer. No caching
  // flags are enabled here on purpose -- Model B is defined by their absence.
};

export default nextConfig;
