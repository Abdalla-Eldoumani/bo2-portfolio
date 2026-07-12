import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { navigation } from "@/lib/data/navigation";

// Sitemap: the lobby, the six screen routes (from the shared navigation
// manifest — never re-hardcoded), and /resume. Evaluated at build time.

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: `${siteConfig.url}/`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    ...navigation.map((item) => ({
      url: `${siteConfig.url}${item.href}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteConfig.url}/resume`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];
}
