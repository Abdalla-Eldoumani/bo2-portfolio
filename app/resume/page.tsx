import type { Metadata } from 'next';
import Link from 'next/link';
import { Scene } from '@/components/chrome/scene';
import { PrintButton } from '@/components/resume/print-button';
import { siteConfig } from '@/lib/site-config';
import { experiences, education } from '@/lib/data/experience';
import { loadout } from '@/lib/data/skills';
import { getProjectByName } from '@/lib/data/projects';

/*
  /resume — the field dossier. On screen: a paper sheet floating over the
  dimmed scene + an EXPORT rail (print / download). In print: the sheet IS
  the page — the globals.css print block strips scene, chrome and glows;
  Letter, 0.6in margins, ATS-readable order, entries never split.

  The paper register is the sanctioned light-surface exception: raw hex is
  deliberate here (paper #f5f4f0, ink #1c2126) because the dark theme tokens
  must not leak onto the sheet.
*/

const description = `The full service record — experience, education, projects and technical loadout for ${siteConfig.name}, ${siteConfig.jobTitle.toLowerCase()}. Read it here or print the PDF.`;

export const metadata: Metadata = {
  title: 'Resume',
  description,
  alternates: { canonical: '/resume' },
  openGraph: {
    title: 'Resume',
    description,
    url: `${siteConfig.url}/resume`,
    type: 'website',
  },
};

// Paper palette (this file + print only).
const PAPER = '#f5f4f0';
const P_INK = '#1c2126';
const P_INK2 = '#454f57';
const P_HEAD = '#b4640a'; // print-safe warm head color
const P_RULE = '#d8d5cd';

const RESUME_PROJECTS = ['Peregrine', 'Qala', 'Rust HTTP Server', 'AEOS — Educational OS']
  .map((n) => getProjectByName(n))
  .filter((p): p is NonNullable<typeof p> => Boolean(p));

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 mt-6 border-b-2 pb-1 font-display text-[17px] font-bold uppercase tracking-[0.02em] first:mt-0"
      style={{ color: P_HEAD, borderColor: P_HEAD }}
    >
      {children}
    </h2>
  );
}

export default function ResumePage() {
  return (
    <>
      <Scene variant="interior" />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col gap-6 px-4 pb-24 pt-16 sm:px-6 lg:flex-row lg:items-start lg:px-9 lg:pt-[72px] print:block print:p-0"
      >
        {/* Visible back control — /resume has no hint bar, so the escape
            route gets a real on-screen button (screen only). */}
        <Link
          data-print-hide
          href="/"
          className="confirm-punch fixed left-4 top-14 z-40 flex items-center gap-2 sm:left-6 lg:left-9 lg:top-16"
        >
          <span className="keycap text-ink">ESC</span>
          <span className="font-label text-[13px] font-semibold tracking-[0.05em] text-ink-2">
            RETURN TO LOBBY
          </span>
        </Link>
        {/* Paper sheet */}
        <article
          data-resume-sheet
          className="w-full max-w-[780px] px-6 py-7 sm:px-9 sm:py-9 print:max-w-none print:p-0 print:shadow-none"
          style={{ background: PAPER, color: P_INK }}
        >
          {/* Sheet head */}
          <header data-resume-entry>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-[34px] font-bold uppercase leading-none">
                {siteConfig.name}
              </h1>
              <div
                className="hidden text-right font-mono text-[9px] leading-relaxed sm:block"
                style={{ color: P_INK2 }}
              >
                FILE SR-0427
                <br />
                2026-07
              </div>
            </div>
            <p
              className="mt-2 font-mono text-[11px] leading-relaxed"
              style={{ color: P_INK2 }}
            >
              {siteConfig.email} · +1 (403) 708-6931 ·
              github.com/{siteConfig.callsign} · linkedin.com/in/abdallaeldoumani
            </p>
          </header>

          <div className="my-4 h-px w-full" style={{ background: P_RULE }} />

          {/* EDUCATION */}
          <section aria-label="Education" data-resume-entry>
            <SectionHead>Education</SectionHead>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h3 className="text-[14.5px] font-medium">
                {education.degree}, {education.minor} — {education.institution}
              </h3>
              <span className="font-mono text-[10.5px]" style={{ color: P_INK2 }}>
                EXPECTED JUN 2027
              </span>
            </div>
            <p className="mt-1 text-[13px]" style={{ color: P_INK2 }}>
              GPA {education.gpa} · {education.honors}
            </p>
          </section>

          {/* EXPERIENCE */}
          <section aria-label="Work experience">
            <SectionHead>Work Experience</SectionHead>
            <div className="flex flex-col gap-4">
              {experiences.map((role) => (
                <article key={role.role + role.company} data-resume-entry>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="text-[14.5px] font-medium">
                      {role.role} — {role.company}
                    </h3>
                    <span
                      className="font-mono text-[10.5px] uppercase"
                      style={{ color: P_INK2 }}
                    >
                      {role.duration}
                    </span>
                  </div>
                  <ul className="mt-1 flex flex-col gap-1">
                    {role.achievements.slice(0, 3).map((a) => (
                      <li
                        key={a}
                        className="flex gap-2 text-[13px] leading-snug"
                        style={{ color: P_INK2 }}
                      >
                        <span aria-hidden="true" className="shrink-0" style={{ color: P_HEAD }}>
                          ▸
                        </span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* PROJECTS */}
          <section aria-label="Projects">
            <SectionHead>Projects</SectionHead>
            <ul className="flex flex-col gap-1.5">
              {RESUME_PROJECTS.map((p) => (
                <li
                  key={p.name}
                  data-resume-entry
                  className="text-[13px] leading-snug"
                  style={{ color: P_INK2 }}
                >
                  <span className="font-medium" style={{ color: P_INK }}>
                    {p.name}
                  </span>{' '}
                  ({p.tech.slice(0, 3).join(', ')}) — {p.metrics ?? p.description}
                </li>
              ))}
            </ul>
          </section>

          {/* SKILLS */}
          <section aria-label="Skills" data-resume-entry>
            <SectionHead>Skills</SectionHead>
            <div className="flex flex-col gap-1 text-[13px]" style={{ color: P_INK2 }}>
              <p>
                <span className="font-medium" style={{ color: P_INK }}>
                  Systems:
                </span>{' '}
                {loadout.primary.join(', ')}
              </p>
              <p>
                <span className="font-medium" style={{ color: P_INK }}>
                  Web &amp; Cloud:
                </span>{' '}
                {loadout.secondary.join(', ')}
              </p>
              <p>
                <span className="font-medium" style={{ color: P_INK }}>
                  Data / AI &amp; Tooling:
                </span>{' '}
                {loadout.perks.join(', ')}
              </p>
            </div>
          </section>
        </article>

        {/* EXPORT rail (screen only) */}
        <aside
          data-print-hide
          className="panel panel-floating w-full max-w-[780px] shrink-0 lg:sticky lg:top-[72px] lg:w-[300px]"
        >
          <div className="panel-header">
            <span>EXPORT</span>
          </div>
          <div className="flex flex-col gap-2.5 p-4">
            <PrintButton />
            <a
              href="/resume.pdf"
              download
              className="confirm-punch w-full border border-white/[0.32] px-4 py-2.5 text-center font-display text-[18px] font-bold uppercase text-ink-menu hover:border-orange-frame hover:text-orange-core"
            >
              Download resume.pdf
            </a>
            <ul className="mt-2 flex flex-col gap-1 border-t border-white/[0.08] pt-3 font-mono text-[9.5px] leading-relaxed tracking-[0.04em] text-ink-3">
              <li>PRINT OUTPUT: LETTER · 0.6IN MARGINS</li>
              <li>NO SCENE, NO CHROME, NO GLOWS</li>
              <li>TYPE ≥ 9.5PT · ATS-READABLE ORDER</li>
            </ul>
          </div>
        </aside>
      </main>
    </>
  );
}
