import { getGitHubStats } from '@/lib/api/github';
import { education } from '@/lib/data/experience';

/*
  INTEL ticker — the news line above the hint bar (lobby only). Leads with
  the freshest real GitHub event (live fetch, committed snapshot fallback),
  then committed CV facts. The line drifts across the screen and loops
  (marquee: two copies scrolling -50%); hovering pauses it and reduced
  motion renders it static. Server component — the drift is pure CSS.
*/

export async function Ticker() {
  const stats = await getGitHubStats();
  const latest = stats.recent[0];
  const pushed =
    latest && latest.type === 'PushEvent'
      ? `PUSHED TO ${latest.repo.split('/')[1]?.toUpperCase() ?? latest.repo.toUpperCase()}`
      : null;

  const facts = [
    ...(pushed ? [pushed] : []),
    "DEAN'S LIST 2023–24 + 2024–25",
    'HEAD TA, CPSC 355',
    `${education.degree.toUpperCase()} + PHILOSOPHY MINOR, UCALGARY`,
    'TWO PURE RESEARCH AWARDS',
    '8 OPS ON ROTATION',
  ];
  const line = facts.join('  ·  ');

  return (
    <div
      data-print-hide
      className="ticker-viewport fixed inset-x-0 bottom-[38px] z-30 overflow-hidden border-t border-white/[0.08] py-2 font-mono text-[10px] text-ink-2 sm:text-[11.5px] lg:bottom-[42px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(8,12,15,0.55), rgba(8,12,15,0.75))',
      }}
    >
      {/* One copy of the line: starts fully off-screen right (padding-left
          100% in .ticker-track), drifts across, exits left, loops. The INTEL
          plate masks the left edge with a solid ground. */}
      <div className="ticker-track" aria-label={line}>
        <span aria-hidden="true">{line}</span>
      </div>
      <span className="absolute inset-y-0 left-0 z-10 flex items-center bg-[#0a0f13] pl-4 pr-3 text-orange-core sm:pl-6 lg:pl-9">
        ▸ INTEL
      </span>
    </div>
  );
}
