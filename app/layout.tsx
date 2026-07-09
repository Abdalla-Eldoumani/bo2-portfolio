import type { Metadata, Viewport } from "next";
import { Agdasima, Saira_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
