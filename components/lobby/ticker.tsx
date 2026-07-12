import { getGitHubStats } from '@/lib/api/github';
import { education } from '@/lib/data/experience';

/*
  INTEL ticker — the news wire above the hint bar (lobby only). Leads with
  the freshest real GitHub event (live fetch, committed snapshot fallback),
  then committed CV facts. Endless marquee: the line is repeated into two
  identical sets and the track loops by exactly one set width (-50%), so
  the stream never breaks. Server component — the drift is pure CSS.

  The separator uses en spaces (U+2002): unlike ordinary spaces they are
  never collapsed or trimmed by HTML whitespace processing, so the seam
  between the two sets keeps the exact same rhythm as the rest.
*/

const SEP = '\u2002\u2002\u00B7\u2002\u2002';

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
  const line = facts.join(SEP);
  // One set = the line repeated until it outruns any viewport (~5.5k px);
  // the track holds two sets so the -50% loop point is always mid-stream.
  const set = Array(5).fill(line).join(SEP) + SEP;

  return (
    <div
      data-print-hide
      role="marquee"
      aria-label={line}
      className="ticker-viewport fixed inset-x-0 bottom-[38px] z-30 overflow-hidden border-t border-white/[0.08] py-2 font-mono text-[10px] text-ink-2 sm:text-[11.5px] lg:bottom-[42px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(8,12,15,0.55), rgba(8,12,15,0.75))',
      }}
    >
      <div className="ticker-track">
        <span aria-hidden="true">{set}</span>
        <span aria-hidden="true">{set}</span>
      </div>
      <span className="absolute inset-y-0 left-0 z-10 flex items-center bg-[#0a0f13] pl-4 pr-3 text-orange-core sm:pl-6 lg:pl-9">
        ▸ INTEL
      </span>
    </div>
  );
}
