import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// SYS-04 sitemap: enumerates the two public routes (/ and /resume) from the
// shared siteConfig.url origin — never a re-hardcoded literal. Evaluated at
// build time (a file-convention route), so /sitemap.xml stays static. No
// dynamic request API is read, so it does not dynamic-ize anything.

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: `${siteConfig.url}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/resume`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
