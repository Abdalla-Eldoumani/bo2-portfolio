import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/lib/site-config";
import { Chrome } from "@/components/chrome/chrome";
import "./globals.css";

// Fonts are vendored woff2 (OFL, see app/fonts/OFL-LICENSES.txt) served via
// next/font/local: no third-party font CDN at build or runtime. Variable
// names are the source-font names so they stay distinct from the semantic
// @theme inline tokens (--font-display/-label/-body/-mono) in globals.css.
const agdasima = localFont({
  src: [
    { path: "./fonts/agdasima-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/agdasima-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-agdasima",
  display: "swap",
});

const sairaCondensed = localFont({
  src: [
    { path: "./fonts/saira-condensed-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/saira-condensed-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-saira-cond",
  display: "swap",
});

const saira = localFont({
  src: [
    { path: "./fonts/saira-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/saira-latin-500-normal.woff2", weight: "500" },
  ],
  variable: "--font-saira",
  display: "swap",
});

const mono = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/jetbrains-mono-latin-500-normal.woff2", weight: "500" },
  ],
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

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0a0f13",
};

// Static Person graph for search engines. Every field is a compile-time
// constant from siteConfig, so serializing it into dangerouslySetInnerHTML
// carries no untrusted input.
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
      className={`${agdasima.variable} ${sairaCondensed.variable} ${saira.variable} ${mono.variable}`}
    >
      <body className="text-ink antialiased">
        {/* Skip link: first focusable element, works with JS off. */}
        <a href="#main-content" className="skip-link tap-target">
          <span className="panel inline-flex items-center px-4 py-2 font-label text-[13px] font-semibold uppercase tracking-[0.08em] text-orange-core">
            Skip to content
          </span>
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
        <Chrome />
      </body>
    </html>
  );
}
