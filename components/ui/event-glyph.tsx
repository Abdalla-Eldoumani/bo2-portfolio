import type { Ref } from "react";

// EventGlyph: the GitHub event `type` -> original monochrome means-glyph resolver
// for the killfeed (the "means icon" between the actor and the target). Mirrors
// the Insignia resolver pattern: a plain map + a neutral FALLBACK, Server-safe
// (no "use client", no useId — many glyphs mount per feed, none needs a unique
// id). Every stroke is currentColor (fill="none") so the consumer tints it via a
// text-* utility (--color-ink-secondary in the feed) and it remaps under
// forced-colors; the consumer sizes it via w-/h- (14-16px). Root <svg> is
// aria-hidden + focusable="false" — the glyph is decorative flavor; the row's
// actor/verb/repo text carries the meaning. An unknown `type` degrades to the
// neutral dash: the resolver never throws and never renders blank.
//
// Original geometry only (QUAL-04) on the 0 0 16 16 grid: no traced game emblem,
// no icon-library path data, no emoji. Several event types share one glyph where
// they share a means (both PR events -> merge-arrows, both issue events ->
// dot-square, Create/Public -> plus-in-hex) — the verb, not the glyph, separates
// them.

// Neutral dash — DeleteEvent and any unknown type. A deliberate mark, never blank.
const FALLBACK = <path d="M4 8h8" />;

const GLYPHS: Record<string, React.ReactNode> = {
  // commit-node: a node riding a line (a commit on the history line).
  PushEvent: (
    <>
      <path d="M2 8h3.5" />
      <path d="M10.5 8H14" />
      <circle cx="8" cy="8" r="2.5" />
    </>
  ),
  // plus-in-hex: an additive mark inside a flat-top hex (a repo/branch created).
  CreateEvent: (
    <>
      <path d="M8 2 13.2 5V11L8 14 2.8 11V5Z" />
      <path d="M8 5.5v5" />
      <path d="M5.5 8h5" />
    </>
  ),
  // merge-arrows: two source nodes converging into a merge node.
  PullRequestEvent: (
    <>
      <circle cx="4" cy="4" r="1.6" />
      <circle cx="4" cy="12" r="1.6" />
      <circle cx="12" cy="8" r="1.6" />
      <path d="M4 5.6v4.8" />
      <path d="M5.6 11.4A6 6 0 0 0 10.4 8.4" />
    </>
  ),
  // dot-square: a marked frame (an issue thread).
  IssuesEvent: (
    <>
      <rect x="3" y="3" width="10" height="10" rx="1" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  // star-outline: a five-point star (a watch/star event).
  WatchEvent: (
    <path d="M8 2 9.7 6.1 14 6.4 10.7 9.2 11.8 13.4 8 11 4.2 13.4 5.3 9.2 2 6.4 6.3 6.1z" />
  ),
  // fork-branch: two children splitting from one parent (a fork).
  ForkEvent: (
    <>
      <circle cx="4" cy="4" r="1.6" />
      <circle cx="12" cy="4" r="1.6" />
      <circle cx="8" cy="12" r="1.6" />
      <path d="M4 5.6V7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5.6" />
      <path d="M8 8v2.4" />
    </>
  ),
  // tag: a chamfered label with a punch hole (a release tag).
  ReleaseEvent: (
    <>
      <path d="M2.5 2.5H8l5.5 5.5L8 13.5 2.5 8Z" />
      <circle cx="5.2" cy="5.2" r="1" />
    </>
  ),
};

// Shared-means aliases: types that carry the same glyph as a mapped sibling.
GLYPHS.PublicEvent = GLYPHS.CreateEvent;
GLYPHS.PullRequestReviewEvent = GLYPHS.PullRequestEvent;
GLYPHS.IssueCommentEvent = GLYPHS.IssuesEvent;

export function EventGlyph({
  type,
  className,
  ref,
}: Readonly<{ type: string; className?: string; ref?: Ref<SVGSVGElement> }>) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[type] ?? FALLBACK}
    </svg>
  );
}
