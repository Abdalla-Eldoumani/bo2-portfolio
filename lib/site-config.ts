// Single source of site identity consumed by the metadata export and the
// JSON-LD Person block in app/layout.tsx. Centralized so a domain change or a
// handle change is a one-file edit rather than a scatter of duplicated literals.
// url reads NEXT_PUBLIC_SITE_URL (set per deploy) and falls back to the
// production origin so the build never breaks when the variable is unset.
export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://abdallaeldoumani.vercel.app",
  name: "Abdalla Eldoumani",
  jobTitle: "Software Developer",
  github: "https://github.com/Abdalla-Eldoumani",
  linkedin: "https://www.linkedin.com/in/abdallaeldoumani/",
} as const;
