import type { NextConfig } from "next";

// Content-Security-Policy for a fully self-hosted static site. next/font
// self-hosts its files (font-src 'self'), there are no external scripts or
// analytics in 1.0.0 (script/connect 'self'), and blur placeholders are inlined
// data: URIs (img-src 'self' data:). script/style carry 'unsafe-inline' as the
// deliberate no-nonce tradeoff: the App Router cannot emit a per-request nonce
// without dynamic rendering, and this site takes zero user input, so the XSS
// surface a nonce would close does not exist here. frame-ancestors 'none' pairs
// with X-Frame-Options DENY for clickjacking; object-src 'none' and base-uri /
// form-action 'self' lock the remaining injection sinks.
// Dev-only relaxation: React's development mode uses eval() for debugging
// features (call-stack reconstruction, error overlays); without 'unsafe-eval'
// the dev console fills with CSP errors and the overlay flags an issue on
// every page. Production keeps the strict policy — React never evals there.
const devEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devEval}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

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
  //
  // Security headers are served from here as the ONE source (no vercel.json
  // mirror). They apply to every route via the /(.*) matcher.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
