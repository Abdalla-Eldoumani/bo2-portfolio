import type { Metadata } from 'next';
import { ScreenShell } from '@/components/chrome/screen-shell';
import { bio } from '@/lib/data/bio';
import { education } from '@/lib/data/experience';
import { projects } from '@/lib/data/projects';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Service Record',
  description:
    'Operator dossier — identity, operator brief and training record for Abdalla Eldoumani.',
};

/*
  Service Record — the operator dossier. Three panels: ID FILE (portrait slot
  + identity rows), OPERATOR BRIEF (bio prose verbatim with {em} lifts +
  honest timeline strip), TRAINING RECORD (degree, GPA, Dean's List gold,
  qualifications). Server component; all content from lib/data.
*/

const ID_ROWS: { label: string; value: string }[] = [
  { label: 'NAME', value: siteConfig.name },
  { label: 'CALLSIGN', value: siteConfig.callsign },
  { label: 'STATION', value: bio.station },
  { label: 'ORIGIN', value: bio.origin },
  { label: 'STATUS', value: bio.status },
];

export default function DossierPage() {
  return (
    <ScreenShell
      title="Service Record"
      headerRight={
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10.5px] tracking-[0.1em] text-ink-3">
            {bio.fileRef}
          </span>
          <span className="border border-orange-frame px-2.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-orange-core">
            {bio.clearanceTag}
          </span>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[380px_1fr_412px]">
        {/* ID FILE */}
        <section aria-label="ID file" className="panel rise self-start" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="panel-header">
            <span>ID FILE</span>
            <span>SR-0427</span>
          </div>
          <div className="p-3.5">
            <div className="hatch flex h-[210px] items-center justify-center border border-white/10">
              <span className="px-4 text-center font-mono text-[10px] leading-relaxed tracking-[0.08em] text-ink-3">
                [ OPERATOR PORTRAIT — USER PHOTO ]
              </span>
            </div>
            <div className="flex items-center justify-between border-x border-b border-white/10 px-2.5 py-1.5 font-mono text-[9.5px] tracking-[0.1em]">
              <span className="text-ink-3">CAPTURED 2026</span>
              <span className="text-green">VERIFIED</span>
            </div>
            <dl className="mt-3.5">
              {ID_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b border-white/[0.08] py-2 last:border-b-0"
                >
                  <dt className="font-label text-[10.5px] font-semibold tracking-[0.12em] text-ink-3">
                    {row.label}
                  </dt>
                  <dd className="text-right font-mono text-[12.5px] text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* OPERATOR BRIEF */}
        <section aria-label="Operator brief" className="panel rise self-start" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="panel-header">
            <span>OPERATOR BRIEF</span>
            <span>2/2 PAGES</span>
          </div>
          <div className="p-4">
            {bio.prose.map((paragraph, i) => (
              <p
                key={i}
                className="mb-4 text-[15px] leading-[1.7] text-ink-2 last:mb-0"
              >
                {paragraph.map((run, j) =>
                  'em' in run ? (
                    <span key={j} className="font-medium text-ink">
                      {run.em}
                    </span>
                  ) : (
                    <span key={j}>{run.text}</span>
                  ),
                )}
              </p>
            ))}

            <div className="mt-5 flex border-t border-white/[0.08] pt-3">
              {[
                { value: '2022', label: 'ENLISTED (UCALGARY)' },
                { value: '2027', label: 'TOUR ENDS (B.SC.)' },
                { value: String(projects.length), label: 'OPS DEPLOYED' },
              ].map((s, i, arr) => (
                <div
                  key={s.label}
                  className={`flex-1 px-1 ${
                    i < arr.length - 1 ? 'border-r border-white/[0.08]' : ''
                  } ${i > 0 ? 'pl-4' : ''}`}
                >
                  <div className="font-display text-[24px] font-bold leading-none text-orange-core">
                    {s.value}
                  </div>
                  <div className="mt-1 font-label text-[9.5px] font-semibold tracking-[0.1em] text-ink-3">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRAINING RECORD */}
        <section aria-label="Training record" className="panel rise self-start md:col-span-2 lg:col-span-1" style={{ '--i': 3 } as React.CSSProperties}>
          <div className="panel-header">
            <span>TRAINING RECORD</span>
            <span>2022–2027</span>
          </div>
          <div className="p-4">
            <div className="font-display text-[22px] font-bold uppercase leading-tight text-ink">
              {education.degree}
            </div>
            <div className="mt-1 font-label text-[12px] font-semibold tracking-[0.06em] text-ink-2">
              {education.minor?.toUpperCase()} · {education.institution.toUpperCase()}
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-[40px] font-bold leading-none text-orange-core">
                {education.gpa.split('/')[0]}
              </span>
              <span className="font-mono text-[12px] text-ink-3">
                /{education.gpa.split('/')[1]} GPA
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 bg-gold"
                style={{
                  clipPath:
                    'polygon(50% 0, 100% 30%, 100% 70%, 50% 100%, 0 70%, 0 30%)',
                }}
              />
              <span className="font-mono text-[11px] tracking-[0.08em] text-gold">
                DEAN&apos;S LIST 2023–24 · 2024–25
              </span>
            </div>

            <div className="mt-5 border-t border-white/[0.08] pt-3">
              <div className="mb-2 font-label text-[11px] font-semibold tracking-[0.12em] text-ink-3">
                QUALIFICATIONS EARNED
              </div>
              <ul className="flex flex-col gap-1.5">
                {education.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex gap-2 text-[12.5px] leading-relaxed text-ink-2"
                  >
                    <span aria-hidden="true" className="mt-[2px] shrink-0 text-orange-core">
                      ▸
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </ScreenShell>
  );
}
