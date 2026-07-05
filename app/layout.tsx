import type { Metadata } from "next";
import { Agdasima, Saira_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const agdasima = Agdasima({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const saira = Saira_Condensed({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-label",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Abdalla Eldoumani",
    template: "%s | Abdalla Eldoumani",
  },
  description:
    "Software developer working from registers to React: systems programming, full-stack web, and teaching.",
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
      <body className="bg-void text-ink antialiased">{children}</body>
    </html>
  );
}
