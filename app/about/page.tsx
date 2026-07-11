import type { Metadata } from 'next';
import { ScreenShell } from '@/components/chrome/screen-shell';
import { whyIntel, operatorBio, qualifications, siteSpec } from '@/lib/data/about';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why this portfolio looks like the Black Ops 2 menu system — a love letter to one of the best game UIs ever shipped, rebuilt from scratch with zero game assets.',
  alternates: { canonical: '/about' },
};

/*
  About — screen 07. THE WHY (the nostalgia mission brief), OPERATOR BIO,
  FIELD QUALIFICATIONS (capability → proof) and THIS MACHINE (the site's own
  spec sheet). Server component; all copy from lib/data/about.
*/

function Prose({
  runs,
}: {
  runs: readonly (readonly ({ text: string } | { em: string })[])[];
}) {
  return (
    <>
      {runs.map((paragraph, i) => (
        <p key={i} className="mb-4 text-[15px] leading-[1.7] text-ink-2 last:mb-0">
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
    </>
  );
}

export default function AboutPage() {
  return (
    <ScreenShell
      title="About"
      headerRight={
        <span className="font-mono text-[11px] tracking-[0.14em] text-ink-2">
          WHY THIS LOBBY EXISTS
        </span>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,640px)_1fr]">
        <div className="flex flex-col gap-6">
          <section aria-label="Why this portfolio exists" className="panel rise" style={{ '--i': 1 } as React.CSSProperties}>
            <div className="panel-header">
              <span>THE WHY</span>
              <span>NOSTALGIA // AUTHORIZED</span>
            </div>
            <div className="p-4">
              <Prose runs={whyIntel} />
            </div>
          </section>

          <section aria-label="Operator bio" className="panel rise" style={{ '--i': 2 } as React.CSSProperties}>
            <div className="panel-header">
              <span>OPERATOR BIO</span>
            </div>
            <div className="p-4">
              <Prose runs={operatorBio} />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section aria-label="Field qualifications" className="panel rise w-full self-start" style={{ '--i': 3 } as React.CSSProperties}>
            <div className="panel-header">
              <span>FIELD QUALIFICATIONS</span>
              <span>{String(qualifications.length).padStart(2, '0')}</span>
            </div>
            <dl>
              {qualifications.map((q) => (
                <div
                  key={q.capability}
                  className="flex items-baseline justify-between gap-4 border-b border-white/[0.08] px-4 py-2.5 last:border-b-0"
                >
                  <dt className="font-display text-[16px] font-bold uppercase text-ink">
                    {q.capability}
                  </dt>
                  <dd className="text-right font-mono text-[10.5px] tracking-[0.04em] text-ink-2">
                    {q.proof.toUpperCase()}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-label="How this site is built" className="panel rise w-full self-start" style={{ '--i': 4 } as React.CSSProperties}>
            <div className="panel-header">
              <span>THIS MACHINE</span>
            </div>
            <ul className="flex flex-col gap-1.5 p-4">
              {siteSpec.map((line) => (
                <li key={line} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                  <span aria-hidden="true" className="mt-[2px] shrink-0 text-orange-core">
                    ▸
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </ScreenShell>
  );
}
