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
  "Software developer working from registers to React — systems, compilers, kernels and full-stack web. A portfolio styled as the Black Ops 2 menu system, every pixel original.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.jobTitle}`,
    template: `%s | ${siteConfig.name}`,
  },
  description,
  applicationName: `${siteConfig.name} — Portfolio`,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  keywords: [
    "Abdalla Eldoumani",
    "software developer",
    "systems programming",
    "compilers",
    "operating systems",
    "ARM64",
    "Rust",
    "C++",
    "WebAssembly",
    "University of Calgary",
    "Calgary developer",
    "Black Ops 2 portfolio",
    "gamified portfolio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.jobTitle}`,
    description,
    url: siteConfig.url,
    siteName: `${siteConfig.name} — Portfolio`,
    type: "website",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.jobTitle}`,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0a0f13",
};

// Static Person + WebSite graph for search engines. Every field is a
// compile-time constant from siteConfig / public facts, so serializing it
// into dangerouslySetInnerHTML carries no untrusted input.
const graphLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteConfig.url}/#person`,
      name: siteConfig.name,
      url: siteConfig.url,
      email: `mailto:${siteConfig.email}`,
      jobTitle: siteConfig.jobTitle,
      sameAs: [siteConfig.github, siteConfig.linkedin],
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "University of Calgary",
      },
      knowsAbout: [
        "Systems programming",
        "Compilers",
        "Operating systems",
        "ARM64 assembly",
        "Rust",
        "C++",
        "WebAssembly",
        "Full-stack web development",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Calgary",
        addressRegion: "AB",
        addressCountry: "CA",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: `${siteConfig.name} — Portfolio`,
      description:
        "A software developer portfolio styled as the Black Ops 2 menu system. Every asset original.",
      publisher: { "@id": `${siteConfig.url}/#person` },
    },
  ],
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
            __html: JSON.stringify(graphLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
        <Chrome />
      </body>
    </html>
  );
}
