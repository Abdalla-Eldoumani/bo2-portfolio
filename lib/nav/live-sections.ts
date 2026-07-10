// Live-vs-LOCKED derivation for the Phase 4 navigation rail. Pure and DOM-free:
// which of the 7 rail entries render as real anchors is derived from the ids
// actually present on the page, never hardcoded in the rail component. As later
// phases mount more sections, they extend the present list and entries unlock
// with zero rail rework.

/** True iff `id` is one of the present (live) section ids. */
export function isLive(id: string, presentIds: readonly string[]): boolean {
  return presentIds.includes(id);
}

/**
 * Spread each nav item with a `live` boolean derived from `presentIds`, preserving
 * input order (the rail renders in page order). This is the single source of the
 * live/locked decision — the rail component must not carry its own list.
 */
export function deriveNav<T extends { id: string }>(
  nav: readonly T[],
  presentIds: readonly string[],
): (T & { live: boolean })[] {
  return nav.map((item) => ({ ...item, live: isLive(item.id, presentIds) }));
}
