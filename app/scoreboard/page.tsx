import type { Metadata } from 'next';
import { ScreenShell } from '@/components/chrome/screen-shell';
import { EventGlyph } from '@/components/ui/event-glyph';
import { Counter } from '@/components/scoreboard/counter';
import { Resync } from '@/components/scoreboard/resync';
import { getGitHubStats } from '@/lib/api/github';
import { siteConfig } from '@/lib/site-config';
import { timeAgo } from '@/lib/utils/time-ago';
import { formatSynced } from '@/lib/utils/format-synced';

export const metadata: Metadata = {
  title: 'Scoreboard',
  description:
    'Live GitHub telemetry — career totals and recent public activity.',
};

/*
  Scoreboard — MATCH RESULTS (career totals with the highlighted self-row +
  roll-up counter tiles) and the KILLFEED (recent public events). LIVE vs
  FALLBACK is a designed state, never a spinner: the fallback flips the
  uplink chip amber and stamps the snapshot date; layout stays identical.
*/

const VERBS: Record<string, string> = {
  PushEvent: 'PUSHED',
  WatchEvent: 'STARRED',
  CreateEvent: 'CREATED',
  ForkEvent: 'FORKED',
  PullRequestEvent: 'PR',
  IssuesEvent: 'ISSUE',
  DeleteEvent: 'DELETED',
  ReleaseEvent: 'RELEASED',
  PublicEvent: 'OPENED',
};

export default async function ScoreboardPage() {
  const stats = await getGitHubStats();
  const live = stats.source === 'live';

  const tiles = [
    { label: 'PUBLIC REPOS', value: stats.publicRepos },
    { label: 'STARS EARNED', value: stats.stars },
    { label: 'FOLLOWERS', value: stats.followers },
    { label: 'FOLLOWING', value: stats.following },
  ];

  return (
    <ScreenShell
      title="Scoreboard"
      headerRight={
        <span
          className={`flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] ${
            live ? 'text-green' : 'text-gold'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-green' : 'bg-gold'}`}
          />
          {live ? 'GITHUB UPLINK LIVE' : `SOURCE: SNAPSHOT ${stats.syncedAt.slice(5, 10)}`}
        </span>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,600px)_1fr]">
        {/* MATCH RESULTS */}
        <section aria-label="Match results" className="panel rise self-start" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="panel-header">
            <span>MATCH RESULTS — CAREER TOTALS</span>
            <span>@{siteConfig.callsign.toUpperCase()}</span>
          </div>
          <div className="p-3.5">
            {/* Scoreboard table: header + the self-row highlight. */}
            <div
              className="grid grid-cols-[1fr_repeat(4,minmax(52px,72px))] gap-x-2 border-b border-white/[0.08] px-2 pb-1.5 font-label text-[10px] font-semibold tracking-[0.1em] text-ink-3"
              aria-hidden="true"
            >
              <span>PLAYER</span>
              <span className="text-right">REPOS</span>
              <span className="text-right">FLWRS</span>
              <span className="text-right">FLWNG</span>
              <span className="text-right">STARS</span>
            </div>
            <div
              className="grid grid-cols-[1fr_repeat(4,minmax(52px,72px))] items-center gap-x-2 border-l-4 border-orange-fill px-2 py-2"
              style={{ background: 'rgba(255,150,0,0.18)' }}
            >
              <span className="truncate font-display text-[17px] font-bold uppercase text-ink">
                {siteConfig.callsign}
              </span>
              {[stats.publicRepos, stats.followers, stats.following, stats.stars].map(
                (v, i) => (
                  <span
                    key={i}
                    className="text-right font-mono text-[14px] tabular-nums text-ink"
                  >
                    {v}
                  </span>
                ),
              )}
            </div>

            {/* Counter tiles */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {tiles.map((t) => (
                <div
                  key={t.label}
                  className="border border-white/[0.08] bg-[rgba(10,15,19,0.5)] px-3 py-3"
                >
                  <div className="font-display text-[34px] font-bold leading-none tabular-nums text-orange-core">
                    <Counter value={t.value} />
                  </div>
                  <div className="mt-1 font-label text-[10px] font-semibold tracking-[0.1em] text-ink-3">
                    {t.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
              <span className="font-mono text-[10px] tracking-[0.06em] text-ink-3">
                LAST SYNC {formatSynced(stats.syncedAt).toUpperCase()} ·{' '}
                {live ? 'SOURCE: LIVE API' : 'SOURCE: COMMITTED SNAPSHOT'}
              </span>
              <Resync />
            </div>
          </div>
        </section>

        {/* KILLFEED */}
        <section aria-label="Recent activity" className="panel rise self-start" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="panel-header">
            <span>KILLFEED — RECENT ACTIVITY</span>
            <span>{stats.recent.length} EVENTS</span>
          </div>
          {stats.recent.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-[19px] font-bold uppercase text-ink-2">
                No recent transmissions
              </p>
              <p className="mt-1 font-mono text-[10.5px] text-ink-3">
                LAST SYNC {formatSynced(stats.syncedAt).toUpperCase()}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.08]">
              {stats.recent.map((event, i) => {
                const verb = VERBS[event.type] ?? 'TRANSMIT';
                const [owner, repo] = event.repo.split('/');
                const starred = verb === 'STARRED';
                return (
                  <li
                    key={event.id}
                    className="rise flex items-center gap-3 px-3.5 py-2.5"
                    style={{ '--i': Math.min(i + 2, 8) } as React.CSSProperties}
                  >
                    <EventGlyph
                      type={event.type}
                      className="h-4 w-4 shrink-0 text-ink-2"
                    />
                    <span
                      className={`shrink-0 px-2 py-0.5 font-label text-[10px] font-semibold tracking-[0.08em] ${
                        starred ? 'text-gold' : 'text-orange-core'
                      }`}
                      style={{
                        background: starred
                          ? 'rgba(217,164,65,0.14)'
                          : 'rgba(255,150,0,0.14)',
                      }}
                    >
                      {verb}
                    </span>
                    <a
                      href={`https://github.com/${event.repo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2 hover:text-orange-core"
                    >
                      <span className="text-ink-3">{owner}/</span>
                      <span className="text-ink">{repo}</span>
                    </a>
                    <span className="shrink-0 font-mono text-[10px] uppercase text-ink-3">
                      {timeAgo(event.createdAt, stats.syncedAt)} ago
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </ScreenShell>
  );
}
