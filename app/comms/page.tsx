import type { Metadata } from 'next';
import { ScreenShell } from '@/components/chrome/screen-shell';
import { Channels } from '@/components/comms/channels';
import { FieldStatus } from '@/components/comms/field-status';
import { contact } from '@/lib/data/contact';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Comms',
  description:
    'Open a channel — email, GitHub and LinkedIn. Open to Summer 2026 internships.',
};

/*
  Comms — sparse by design; the scene breathes. SECURE CHANNELS (email
  pre-selected) + FIELD STATUS rail; the site footer band (identity left,
  inspiration/legal note right) lives here. The red mast beacon is the only
  red on screen (2s blink, stripped under reduced motion).
*/

export default function CommsPage() {
  return (
    <>
      {/* Radio-mast beacon, aria-hidden scene flavor. */}
      <div
        aria-hidden="true"
        data-print-hide
        className="pointer-events-none fixed right-[12%] top-[22%] -z-[5] hidden lg:block"
      >
        <div className="mx-auto h-40 w-[2px] bg-white/[0.07]" />
        <span
          className="blink-beacon absolute -top-1.5 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red"
          style={{ boxShadow: '0 0 10px rgba(176,58,48,0.8)' }}
        />
      </div>

      <ScreenShell
        title="Comms"
        headerRight={
          <span className="font-mono text-[11px] tracking-[0.14em] text-ink-2">
            ALL CHANNELS OPEN
          </span>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,700px)_minmax(320px,400px)]">
          <section aria-label="Secure channels">
            <div className="panel rise" style={{ '--i': 1 } as React.CSSProperties}>
              <div className="panel-header">
                <span>SECURE CHANNELS</span>
                <span>3 OPEN</span>
              </div>
              <div className="p-2.5">
                <Channels />
              </div>
            </div>
            <p className="rise mt-4 max-w-[62ch] text-[14px] leading-relaxed text-ink-2" style={{ '--i': 3 } as React.CSSProperties}>
              {contact.invitation.map((run, i) =>
                'em' in run ? (
                  <span key={i} className="font-medium text-ink">
                    {run.em}
                  </span>
                ) : (
                  <span key={i}>{run.text}</span>
                ),
              )}
            </p>
          </section>

          <aside className="rise self-start" style={{ '--i': 2 } as React.CSSProperties}>
            <FieldStatus />
          </aside>
        </div>

        {/* Site footer band */}
        <footer className="mt-auto flex flex-col gap-2 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-10 lg:mt-16">
          <span className="max-w-[46ch] font-mono text-[10px] leading-relaxed tracking-[0.06em] text-ink-3">
            {siteConfig.name.toUpperCase()} · {contact.colophon.builtWith.toUpperCase()}
          </span>
          <span className="max-w-[52ch] font-mono text-[10px] leading-relaxed tracking-[0.04em] text-ink-3 sm:text-right">
            {contact.colophon.originalWork}
          </span>
        </footer>
      </ScreenShell>
    </>
  );
}
