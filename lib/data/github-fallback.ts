import type { GitHubStats } from '@/lib/types/github';

/**
 * Committed GitHub snapshot the scoreboard serves when the live API is
 * rate-limited, unreachable, or returns a shape the guard rejects. It is what
 * keeps the panel populated instead of a spinner or an empty state (SCORE-02),
 * so it has to be static and deterministic: `syncedAt` is a fixed literal rather
 * than a live clock read, so the value does not drift build to build. The numbers were
 * captured manually from the public `/users/{handle}` + `/users/{handle}/repos`
 * endpoints on the date below; Phase 8 extends `stars`/`recent` through their own
 * guarded endpoints, so `recent` ships empty here.
 */
export const githubFallback = {
  source: 'fallback',
  publicRepos: 58,
  followers: 21,
  following: 16,
  stars: 41,
  recent: [],
  syncedAt: '2026-07-06T00:00:00Z',
} satisfies GitHubStats;
