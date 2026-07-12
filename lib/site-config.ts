// Single source of site identity consumed by the metadata export and the
// JSON-LD Person block in app/layout.tsx. Centralized so a domain change or a
// handle change is a one-file edit rather than a scatter of duplicated literals.
//
// url precedence — this is what keeps share cards honest. og:url/canonical
// must point at THE domain actually being visited, or scrapers (Facebook,
// LinkedIn, Slack) follow og:url as canonical and render someone else's
// card. 1) NEXT_PUBLIC_SITE_URL: explicit per-deploy override, set it when
// a custom domain fronts the site. 2) VERCEL_PROJECT_PRODUCTION_URL: the
// project's own production domain, injected by Vercel at build time when
// system env vars are exposed (the default). 3) A last-resort literal so
// local builds never break.
const githubHandle = "Abdalla-Eldoumani";

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteConfig = {
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (vercelHost ? `https://${vercelHost}` : "https://bo2-portfolio.vercel.app"),
  name: "Abdalla Eldoumani",
  jobTitle: "Software Developer",
  email: "aamsdoumani@gmail.com",
  github: `https://github.com/${githubHandle}`,
  callsign: githubHandle,
  linkedin: "https://www.linkedin.com/in/abdallaeldoumani/",
} as const;
