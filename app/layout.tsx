import type { Metadata, Viewport } from "next";
import { Agdasima, Saira_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import { CommandPalette } from "@/components/command-palette";
import "./globals.css";

// Variable names are the source-font names so they stay distinct from the
// semantic @theme inline tokens (--font-display/-label/-body/-mono) in
// globals.css; a shared name would self-reference and resolve to empty.
// adjustFontFallback is left at its default (on) for metric-matched fallbacks
// and near-zero font-load CLS.
const agdasima = Agdasima({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-agdasima",
  display: "swap",
});

const saira = Saira_Condensed({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-saira",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const description =
  "Software developer working from registers to React: systems programming, full-stack web, and teaching.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description,
  openGraph: {
    title: siteConfig.name,
    description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
};

// colorScheme belongs in the viewport export in Next 16 (metadata emits a
// deprecation warning); it mirrors the :root color-scheme: dark in globals.css.
export const viewport: Viewport = {
  colorScheme: "dark",
};

// Static Person graph for search engines. Every field is a compile-time
// constant from siteConfig, so serializing it into dangerouslySetInnerHTML
// carries no untrusted input (no user or runtime data is ever interpolated).
const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  url: siteConfig.url,
  jobTitle: siteConfig.jobTitle,
  sameAs: [siteConfig.github, siteConfig.linkedin],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${agdasima.variable} ${saira.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="bg-void text-ink antialiased">
        {/*
          Skip-link (NAV-05): the FIRST focusable element in the DOM, before the
          JSON-LD script and all page chrome. A native anchor, so it works with
          JS off; its target <main id="main-content" tabindex="-1"> is set in
          plan 04-03. Off-viewport at rest and revealed top-left on focus via
          the .skip-link rule in globals.css; the accent-chip silhouette is the
          existing .chamfer utility parametrized to an accent edge on the void
          fill (inner span in relative z-[1] so it paints over the ::before).
        */}
        <a
          href="#main-content"
          className="skip-link chamfer tap-target"
          style={
            {
              "--_c": "var(--chamfer-sm)",
              "--_edge": "var(--color-accent)",
              "--_fill": "var(--color-void)",
            } as React.CSSProperties
          }
        >
          <span className="relative z-[1] inline-flex items-center px-4 py-2 font-label text-data uppercase tracking-[0.08em] text-accent">
            SKIP TO CONTENT
          </span>
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
        {/*
          The Cmd+K command palette (SYS-02): one client leaf mounted globally
          after {children} so its keydown listener and Modal work on every route
          (home, /resume, the 404). Mounting a client leaf from the Server layout
          adds no `use client` here — it stays a Server Component.
        */}
        <CommandPalette />
      </body>
    </html>
  );
}
