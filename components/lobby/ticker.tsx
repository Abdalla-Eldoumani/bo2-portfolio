import { getGitHubStats } from '@/lib/api/github';
import { education } from '@/lib/data/experience';

/*
  INTEL ticker — the static news line above the hint bar (lobby only).
  Leads with the freshest real GitHub event (live fetch, committed snapshot
  fallback), then committed CV facts. Static by approved default: no marquee,
  no loop. Server component.
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
  ];

  return (
    <div
      data-print-hide
      className="fixed inset-x-0 bottom-[38px] z-30 flex items-center gap-3 overflow-hidden whitespace-nowrap border-t border-white/[0.08] px-4 py-2 font-mono text-[10px] text-ink-2 sm:gap-4 sm:px-6 sm:text-[11.5px] lg:bottom-[42px] lg:px-9"
      style={{
        background:
          'linear-gradient(180deg, rgba(8,12,15,0.55), rgba(8,12,15,0.75))',
      }}
    >
      <span className="shrink-0 text-orange-core">▸ INTEL</span>
      <span className="truncate">{facts.join(' · ')}</span>
    </div>
  );
}
