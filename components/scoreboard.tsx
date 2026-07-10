import { Killfeed } from "@/components/ui/killfeed";
import { Panel } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";
import { getGitHubStats } from "@/lib/api/github";
import { siteConfig } from "@/lib/site-config";
import { formatSynced } from "@/lib/utils/format-synced";

// Scoreboard (#scoreboard) — GitHub telemetry as the BO2 scoreboard register.
// An ASYNC Server Component: it `await`s the Phase-2 server-only getGitHubStats()
// and resolves the full GitHubStats BEFORE any HTML is emitted, so no spinner /
// Suspense / loading.tsx ever reaches the client (a loading UI would itself be a
// forbidden SCORE-02 spinner). Mounting an async Server Component from the Server
// page adds no `use client` boundary; because getGitHubStats reads only `fetch`
// (Model B revalidate) with NO headers()/cookies()/searchParams, the `/` route
// stays ○ (Static / ISR). formatSynced is called with NO locale argument —
// reading Accept-Language would opt the route into dynamic rendering and break
// that static invariant (locale = server runtime default, accepted per CONTEXT).
//
// SCORE-02 (the load-bearing mandate): the section renders IDENTICALLY for
// source:'live' and source:'fallback'. It NEVER branches layout, color, or copy
// on `stats.source` — the ONLY observable difference is the LAST SYNCED value
// (formatSynced(stats.syncedAt)). No "cached"/"offline"/"live" badge, no color
// swap, no spinner. A rate-limit/outage renders the committed snapshot and reads
// as a normal, populated scoreboard.
//
// Like the siblings this does NOT use `.panel-reveal` (its scripting-gated hidden
// state needs a client [data-revealed] this Server-only surface cannot set).
// Mirrors the combat-record shell (bg-steel px-5 py-12 sm:px-8 sm:py-16 lg:py-24,
// 1200px measure, Panel header strip with a real <h2 tabIndex={-1}>).
//
// The section's ONE orange is the marquee SCORE — the PUBLIC REPOS stat (Stat
// `marquee`). Everything else is steel/ink; the killfeed carries zero orange
// (green actor / intel target / ink verb). Only framing labels are added strings;
// every number, repo, and timestamp is real data from getGitHubStats().

export async function Scoreboard() {
  const stats = await getGitHubStats();

  return (
    <section
      id="scoreboard"
      aria-labelledby="scoreboard-heading"
      className="bg-steel px-5 py-12 sm:px-8 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Header strip: real <h2> + subtitle on the left, the always-visible LAST
            SYNCED stamp on the right. No accent (the one orange is the marquee
            SCORE); the stamp value is the sole live-vs-fallback difference. */}
        <Panel>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h2
                id="scoreboard-heading"
                tabIndex={-1}
                className="font-display text-h2 uppercase tracking-[0.04em] text-ink"
              >
                Scoreboard
              </h2>
              <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                Live GitHub Telemetry
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                Last Synced
              </p>
              <p className="font-mono text-data leading-[1.4] tabular-nums text-ink-secondary">
                {formatSynced(stats.syncedAt)}
              </p>
            </div>
          </div>
        </Panel>

        {/* Stats block: a COMBAT STATS banner over a line-strong divider, then the
            <dl> scoreboard register — 2-col at 375, 4-col at >=768. PUBLIC REPOS is
            the marquee (the section's single orange). */}
        <Panel className="mt-8">
          <div className="flex flex-col gap-6 p-5 sm:p-6">
            <p className="border-b border-line-strong pb-2 font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Combat Stats
            </p>
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Stat label="Public Repos" value={stats.publicRepos} marquee />
              <Stat label="Stars Earned" value={stats.stars} />
              <Stat label="Followers" value={stats.followers} />
              <Stat label="Following" value={stats.following} />
            </dl>
          </div>
        </Panel>

        {/* Killfeed block: a RECENT ACTIVITY banner over the same divider, then the
            <ol> of real activity rows (zero orange, no aria-live). 24px below the
            stats block. */}
        <Panel className="mt-6">
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <p className="border-b border-line-strong pb-2 font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Recent Activity
            </p>
            <Killfeed
              rows={stats.recent}
              callsign={siteConfig.callsign}
              syncedAt={stats.syncedAt}
            />
          </div>
        </Panel>
      </div>
    </section>
  );
}
