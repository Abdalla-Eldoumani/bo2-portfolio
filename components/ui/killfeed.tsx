import type { Ref } from "react";
import { EventGlyph } from "@/components/ui/event-glyph";
import { cn } from "@/lib/utils/cn";
import type { ActivityRow } from "@/lib/types/github";
import { timeAgo } from "@/lib/utils/time-ago";

// Killfeed: the scoreboard's recent-activity feed, a real <ol> of ActivityRow[]
// read left-to-right actor -> means-glyph -> verb -> target -> time (the
// DESIGN_SYSTEM killfeed grammar). Server-safe (no "use client", no useId;
// ref-as-prop) — all data is resolved server-side. Capped at 6 rows (within the
// DESIGN_SYSTEM 4-6 cap) and rendered in the given order (the source is already
// newest-first: live /events is newest-first, the committed fallback is seeded
// newest-first), so recency is carried by row order.
//
// ZERO orange: actor is --color-online green (the owner/"you" name), target is
// --color-intel (the linked killfeed target), verb + glyph are --color-ink-secondary,
// time is --color-ink-muted. Orange is a BO2 menu color, not in-match feed
// feedback (research finding 10), so the section's one orange stays on the
// scoreboard SCORE and OFF the feed.
//
// NO aria-live, NO auto-advance, NO dwell/fade. The data is build-time / ISR and
// NEVER changes on the client, so there is nothing for a live region to announce;
// an aria-live on static content is misleading noise for AT users. SCORE-03
// explicitly permits static presentation — that is the correct branch precisely
// because there is no client-side data change here.
//
// The repo href is ALWAYS constructed from `row.repo` against the FIXED
// https://github.com/ origin — never a payload-supplied URL (T-08-05). Every
// anchor carries target="_blank" rel="noopener noreferrer" (reverse-tabnabbing,
// T-08-06) and opts into .tap-target (>=44px coarse) — the section's only
// interactive control.

const GITHUB_ORIGIN = "https://github.com/";

// event type -> legible sentence-fragment verb. The glyph carries the theme; the
// verb stays recruiter-legible. An unrecognized type degrades to "was active in"
// (never blank, never a thrown render — mirrors the Insignia unknown-id fallback).
const VERBS: Record<string, string> = {
  PushEvent: "pushed to",
  CreateEvent: "created",
  PullRequestEvent: "opened a pull request in",
  PullRequestReviewEvent: "reviewed a pull request in",
  IssuesEvent: "opened an issue in",
  IssueCommentEvent: "commented in",
  WatchEvent: "starred",
  ForkEvent: "forked",
  ReleaseEvent: "released",
  PublicEvent: "open-sourced",
  DeleteEvent: "removed a branch in",
};

function KillfeedRow({
  row,
  callsign,
  syncedAt,
}: Readonly<{ row: ActivityRow; callsign: string; syncedAt: string }>) {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line-faint py-2 last:border-b-0">
      <span className="font-mono text-data font-bold leading-[1.5] tabular-nums text-online">
        {callsign}
      </span>
      {/* mx-2 widens the glyph seam past the word gaps so the means-glyph reads
          as its own column, the way a killfeed weapon icon does. */}
      <EventGlyph
        type={row.type}
        className="mx-2 h-4 w-4 shrink-0 text-ink-secondary"
      />
      <span className="font-mono text-data leading-[1.5] text-ink-secondary">
        {VERBS[row.type] ?? "was active in"}
      </span>
      <a
        href={`${GITHUB_ORIGIN}${row.repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-target press-flash inline-flex items-center [overflow-wrap:anywhere] font-mono text-data leading-[1.5] text-intel underline-offset-2 hover:underline focus-visible:underline"
      >
        {row.repo}
      </a>
      <span className="ml-auto font-mono text-stat-label leading-[1.5] tabular-nums text-ink-muted">
        {timeAgo(row.createdAt, syncedAt)}
      </span>
    </li>
  );
}

export function Killfeed({
  rows,
  callsign,
  syncedAt,
  className,
  ref,
}: Readonly<{
  rows: readonly ActivityRow[];
  callsign: string;
  syncedAt: string;
  className?: string;
  ref?: Ref<HTMLOListElement>;
}>) {
  // Robustness guard — the committed fallback ships a real recent[], so this is
  // normally unreachable; render a single calm line in the SAME mono register,
  // never a spinner, never an error color, never orange.
  if (rows.length === 0) {
    return (
      <p className={cn("font-mono text-data leading-[1.5] text-ink-secondary", className)}>
        STANDING BY — NO RECENT OPS ON RECORD
      </p>
    );
  }

  return (
    <ol ref={ref} className={cn("flex list-none flex-col", className)}>
      {rows.slice(0, 6).map((row) => (
        <KillfeedRow
          key={row.id}
          row={row}
          callsign={callsign}
          syncedAt={syncedAt}
        />
      ))}
    </ol>
  );
}
