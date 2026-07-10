import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// SYS-04 robots: allow all crawlers and point them at the sitemap. The origin
// reads from the shared siteConfig.url (never re-hardcoded); a file-convention
// route emitted statically at /robots.txt.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
