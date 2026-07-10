import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { experiences, education } from "@/lib/data/experience";
import { loadout } from "@/lib/data/skills";
import { bio } from "@/lib/data/bio";

// The /resume dossier — a standalone Server route (a "pulled file" surface). It
// is fully static: it reads no dynamic request APIs (no header, cookie, or
// search-param access), is not async, and has nothing to await, so the Next-16
// await guard is N/A and the route stays ○ Static. The root layout.tsx still
// wraps it (skip-link, fonts, JSON-LD), so this page owns the
// <main id="main-content" tabIndex={-1}> the skip-link targets.
//
// Content is build-time constant from lib/data + site-config — never re-inlined
// (the hard rule). Only the framing labels (section headings, field labels) are
// added strings. Register is a restrained DOCUMENT subset of the identity system:
// an 820px letter-width column, hairline dividers (not a Panel per section — the
// chrome header strip is the sole Panel). The one orange on this route is the
// EXTRACT FILE download CTA; everything else — RETURN TO LOBBY, the comm
// channels, the current-role Present token — renders in ink/steel.
//
// The @media print block (globals.css) flips the :root tokens to a light-ground
// document and hides every [data-print-hide] chrome element; printing IS the
// extract, so the download control drops off paper.

const description = `The full service record — experience, education, and technical loadout for ${siteConfig.name}, ${siteConfig.jobTitle.toLowerCase()}. Read it here or extract the PDF.`;

export const metadata: Metadata = {
  title: "Resume",
  description,
  // Relative canonical resolves against metadataBase (siteConfig.url) — never
  // re-hardcode the origin (lib/site-config is the single source).
  alternates: { canonical: "/resume" },
  openGraph: {
    title: "Resume",
    description,
    url: `${siteConfig.url}/resume`,
    type: "website",
  },
};

// Comm channels rendered as plain text so the printed sheet carries the contact
// path. GitHub/LinkedIn handles derive from the site-config URLs (no re-hardcode);
// LinkedIn drops the protocol/host to the in/<handle> path (the after-action
// precedent). No brand logos (third-party trademarks); text carries identity.
const linkedinHandle = siteConfig.linkedin
  .replace(/^https?:\/\/(www\.)?linkedin\.com\//, "")
  .replace(/\/$/, "");

const channels = [
  { label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}`, external: false },
  { label: "GitHub", value: siteConfig.callsign, href: siteConfig.github, external: true },
  { label: "LinkedIn", value: linkedinHandle, href: siteConfig.linkedin, external: true },
] as const;

const skillGroups = [
  { label: "Primary", names: loadout.primary },
  { label: "Secondary", names: loadout.secondary },
  { label: "Perks", names: loadout.perks },
] as const;

export default function ResumePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-dvh bg-void px-5 py-8 sm:px-8 sm:py-12"
    >
      <div className="mx-auto w-full max-w-[820px]">
        {/* Chrome bar — screen-only navigation/extraction controls. Printing IS
            the extract, so the whole bar drops off paper (data-print-hide). */}
        <div
          data-print-hide
          className="flex flex-wrap items-center justify-between gap-4 pb-8"
        >
          <Link
            href="/"
            className="tap-target press-flash inline-flex items-center gap-2 font-label text-data uppercase tracking-[0.08em] text-ink-secondary"
          >
            <span aria-hidden="true">←</span>
            Return to Lobby
          </Link>
          <a
            href="/resume.pdf"
            download
            className="chamfer tap-target press-flash"
            style={
              {
                "--_c": "var(--chamfer-sm)",
                "--_edge": "var(--color-accent)",
                "--_fill": "var(--color-void)",
              } as React.CSSProperties
            }
          >
            <span className="relative z-[1] inline-flex items-center px-4 py-2 font-label text-data uppercase tracking-[0.08em] text-accent">
              Extract File
            </span>
          </a>
        </div>

        {/* Dossier header strip — the sole Panel on the route; carries the real
            (single) <h1> name, a mono meta line, and the plain-text comm channels
            the printed sheet needs. */}
        <header className="chamfer" style={{ "--_c": "var(--chamfer-lg)" } as React.CSSProperties}>
          <div className="relative z-[1] flex flex-col gap-4 p-6 sm:p-8">
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-h2 uppercase leading-[1.2] tracking-[0.04em] text-ink">
                {siteConfig.name}
              </h1>
              <p className="font-mono text-data tabular-nums text-ink-secondary">
                {siteConfig.jobTitle} · {bio.station} · {siteConfig.callsign}
              </p>
            </div>
            <dl className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-8">
              {channels.map((channel) => (
                <div key={channel.label} className="flex items-baseline gap-2">
                  <dt className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                    {channel.label}
                  </dt>
                  <dd>
                    <a
                      href={channel.href}
                      {...(channel.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="font-mono text-data text-ink"
                    >
                      {channel.value}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        {/* EXPERIENCE — the 4 roles, source order (newest first), condensed:
            role / company · location / duration meta / achievement bullets. Each
            entry is data-resume-entry so a role never splits across a page. The
            current role's Present token renders in ink, not orange (the one orange
            belongs to EXTRACT FILE). */}
        <section
          aria-labelledby="resume-experience"
          className="mt-12 border-t border-line-strong pt-8"
        >
          <h2
            id="resume-experience"
            className="font-display text-lead uppercase tracking-[0.04em] text-ink"
          >
            Experience
          </h2>
          <div className="mt-6 flex flex-col gap-8">
            {experiences.map((role) => (
              <article
                key={`${role.company}-${role.role}`}
                data-resume-entry
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <h3 className="font-display text-lead uppercase tracking-[0.04em] text-ink">
                    {role.role}
                  </h3>
                  <p className="font-mono text-data tabular-nums text-ink-secondary">
                    {role.duration}
                  </p>
                </div>
                <p className="font-mono text-data text-ink-secondary">
                  {role.company} · {role.location}
                </p>
                <ul className="flex max-w-[68ch] flex-col gap-2">
                  {role.achievements.map((achievement) => (
                    <li
                      key={achievement}
                      className="flex gap-3 font-body text-body leading-[1.6] text-ink-secondary"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.7em] h-px w-3 shrink-0 -skew-x-12 bg-line-strong"
                      />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* EDUCATION — the education object, condensed to one entry. */}
        <section
          aria-labelledby="resume-education"
          className="mt-12 border-t border-line-strong pt-8"
        >
          <h2
            id="resume-education"
            className="font-display text-lead uppercase tracking-[0.04em] text-ink"
          >
            Education
          </h2>
          <article data-resume-entry className="mt-6 flex flex-col gap-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <h3 className="font-display text-lead uppercase tracking-[0.04em] text-ink">
                {education.degree} · {education.minor}
              </h3>
              <p className="font-mono text-data tabular-nums text-ink-secondary">
                {education.duration}
              </p>
            </div>
            <p className="font-mono text-data text-ink-secondary">
              {education.institution} · {education.location}
            </p>
            <p className="font-mono text-data text-ink-secondary">
              {education.honors} · GPA {education.gpa}
            </p>
            <ul className="mt-1 flex max-w-[68ch] flex-col gap-2">
              {education.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex gap-3 font-body text-body leading-[1.6] text-ink-secondary"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.7em] h-px w-3 shrink-0 -skew-x-12 bg-line-strong"
                  />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* SKILLS — the loadout flattened to inline comma-separated groups plus
            the two wildcards as one line each (no Pick 10 pips — the pip meter is
            a lobby interaction; the document shows the plain list). */}
        <section
          aria-labelledby="resume-skills"
          className="mt-12 border-t border-line-strong pb-4 pt-8"
        >
          <h2
            id="resume-skills"
            className="font-display text-lead uppercase tracking-[0.04em] text-ink"
          >
            Skills
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {skillGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                  {group.label}
                </p>
                <p className="font-body text-body leading-[1.6] text-ink">
                  {group.names.join(", ")}
                </p>
              </div>
            ))}
            {loadout.wildcards.map((wildcard) => (
              <p
                key={wildcard.name}
                className="max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary"
              >
                <span className="font-medium text-ink">{wildcard.name}</span> — {wildcard.note}
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
