import type { GitHubStats } from '@/lib/types/github';

/**
 * Committed GitHub snapshot the scoreboard serves when the live API is
 * rate-limited, unreachable, or returns a shape the guard rejects. It is what
 * keeps the panel populated instead of a spinner or an empty state (SCORE-02),
 * so it has to be static and deterministic: `syncedAt` is a fixed literal rather
 * than a live clock read, so the value does not drift build to build. The numbers were
 * captured manually from the public `/users/{handle}` + `/users/{handle}/repos`
 * endpoints. `recent` is a hand-committed real snapshot of the six newest rows
 * from `/users/{handle}/events/public` (no invented events — project honesty
 * rule); re-seed it with a fresh curl of that same public endpoint.
 * `syncedAt` sits just after the newest event's `created_at` so
 * `timeAgo(createdAt, syncedAt)` reads a realistic frozen "X ago as of last sync".
 */
export const githubFallback = {
  source: 'fallback',
  publicRepos: 58,
  followers: 21,
  following: 16,
  stars: 41,
  recent: [
    {
      id: '14582049950',
      type: 'PushEvent',
      repo: 'Abdalla-Eldoumani/Abdalla-Eldoumani',
      createdAt: '2026-07-08T21:27:18Z',
    },
    {
      id: '14569323553',
      type: 'PushEvent',
      repo: 'Abdalla-Eldoumani/Abdalla-Eldoumani',
      createdAt: '2026-07-08T17:16:15Z',
    },
    {
      id: '14567349618',
      type: 'PushEvent',
      repo: 'Abdalla-Eldoumani/Abdalla-Eldoumani',
      createdAt: '2026-07-08T16:40:34Z',
    },
    {
      id: '14567261936',
      type: 'PushEvent',
      repo: 'Abdalla-Eldoumani/Abdalla-Eldoumani',
      createdAt: '2026-07-08T16:39:01Z',
    },
    {
      id: '11522341833',
      type: 'WatchEvent',
      repo: 'Younesfdj/gitfut',
      createdAt: '2026-07-08T16:36:49Z',
    },
    {
      id: '11477343814',
      type: 'WatchEvent',
      repo: 'Abdalla-Eldoumani/peregrine',
      createdAt: '2026-07-07T19:39:14Z',
    },
  ],
  syncedAt: '2026-07-08T22:00:00Z',
} satisfies GitHubStats;
