// Deterministic single-active-section reducer for the Phase 4 scroll-spy rail.
// Pure and DOM-free: the client island projects each real IntersectionObserverEntry
// into an ObservedEntry (id from target.id, centerDistance from boundingClientRect vs
// the viewport middle) and hands the array here. This module never touches the DOM,
// so it runs in Vitest's node env without jsdom.

/**
 * A DOM-free projection of one observed section. `centerDistance` is the absolute
 * distance from the section's box center to the center of the observer band; the
 * island computes it, the reducer only compares it.
 */
export type ObservedEntry = {
  id: string;
  isIntersecting: boolean;
  centerDistance: number;
};

/**
 * Resolve exactly one active section id from a set of observed entries.
 *
 * - Sole intersector wins outright (regardless of its centerDistance, so a section
 *   taller than the band still resolves while it is the only one crossing).
 * - Zero intersectors keeps `prev` (a fast programmatic scroll can clear the band
 *   momentarily); with no `prev` the result is undefined — an absent/locked target
 *   never forces an active id.
 * - Multiple intersectors resolve to the one nearest the band center by
 *   `centerDistance`, ties broken by array order (the island passes entries in DOM
 *   order, so the earlier section wins).
 */
export function resolveActiveSection(
  entries: readonly ObservedEntry[],
  prev?: string,
): string | undefined {
  const intersecting = entries.filter((e) => e.isIntersecting);
  if (intersecting.length === 0) return prev;

  let nearest = intersecting[0];
  for (const candidate of intersecting) {
    // Strict less-than preserves the first (earliest DOM-order) entry on a tie.
    if (candidate.centerDistance < nearest.centerDistance) {
      nearest = candidate;
    }
  }
  return nearest.id;
}
