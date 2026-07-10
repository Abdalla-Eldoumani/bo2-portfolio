import 'server-only';

import { githubFallback } from '@/lib/data/github-fallback';
import { siteConfig } from '@/lib/site-config';
import type { GitHubStats } from '@/lib/types/github';

// Fixed GitHub REST base plus the profile handle derived from the single
// site-identity source. The handle never comes from a request or user input, so
// the fetch target is always a fixed api.github.com/users/<handle> URL with no
// steerable host or path (no SSRF surface). A malformed config degrades to '',
// which 404s and falls through to the committed snapshot rather than crashing.
const GH = 'https://api.github.com';
const USER = siteConfig.github.split('/').filter(Boolean).pop() ?? '';

// The token, when set, only raises the rate limit (60/hr -> 5000/hr); public
// endpoints need none. It is a plain server env var -- never NEXT_PUBLIC_, so it
// cannot be inlined into client JS -- and is read only here, inside the
// import 'server-only' module.
const HEADERS: HeadersInit = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

// As-free guards: narrow `unknown` with typeof checks instead of a cast, so a
// malformed payload is rejected here rather than crashing a later render.
// isRecord leaves each property typed `unknown`, which typeof then narrows.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUserPayload(value: unknown): value is {
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
} {
  return (
    isRecord(value) &&
    typeof value.public_repos === 'number' &&
    typeof value.followers === 'number' &&
    typeof value.following === 'number' &&
    typeof value.created_at === 'string'
  );
}

// /users/{u}/repos → array of repo records. An EMPTY array is VALID live-empty:
// `[].every` is vacuously true and a real account with zero public repos must
// honestly show 0 stars, never the inflated fallback number. Reject only a
// non-array or an item missing a numeric stargazers_count.
function isRepoPayload(
  value: unknown,
): value is Array<Record<string, unknown> & { stargazers_count: number }> {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => isRecord(item) && typeof item.stargazers_count === 'number',
    )
  );
}

// /users/{u}/events/public → array of event records. An EMPTY array is VALID
// live-empty (the UI renders the designed STANDING BY state, never stale rows).
// An UNKNOWN `type` string is KEPT — the guard only checks that `type` is a
// string; the UI verb map handles unknown verbs. Reject a non-array or any item
// missing the string `type` / record `repo.name` / string `created_at`.
function isEventPayload(value: unknown): value is Array<
  Record<string, unknown> & {
    type: string;
    repo: { name: string };
    created_at: string;
  }
> {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.type === 'string' &&
        isRecord(item.repo) &&
        typeof item.repo.name === 'string' &&
        typeof item.created_at === 'string',
    )
  );
}

// Model B: each fetch caches for an hour and is tagged for on-demand
// revalidation. Without next.revalidate, Next 16 refetches on every render and
// burns the unauthenticated 60/hr limit. Any non-OK status or thrown fetch
// resolves to null so the caller degrades to the committed fallback.
async function safeJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      next: { revalidate: 3600, tags: ['github'] },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Resolves GitHubStats for the scoreboard and never throws to the caller. Three
// surfaces (profile / repos / events) are fetched together and guarded
// INDEPENDENTLY: a 403 / network / shape failure on one surface degrades only
// that surface to the committed fallback, so a single-endpoint outage never
// blanks the section. `source` is 'live' only when all three validate; it is
// 'fallback' when any surface degraded (the stamp semantics stay simple). When
// ALL three degrade the committed snapshot is returned verbatim (literal
// syncedAt), so the register-identical fallback stays byte-for-byte stable.
export async function getGitHubStats(): Promise<GitHubStats> {
  const [rawUser, rawRepos, rawEvents] = await Promise.all([
    safeJson(`${GH}/users/${USER}`),
    safeJson(`${GH}/users/${USER}/repos?per_page=100&sort=updated`),
    safeJson(`${GH}/users/${USER}/events/public?per_page=30`),
  ]);

  const userOk = isUserPayload(rawUser);
  const reposOk = isRepoPayload(rawRepos);
  const eventsOk = isEventPayload(rawEvents);

  // All three surfaces down → serve the committed snapshot verbatim. This is the
  // dominant rate-limit case; returning the literal keeps `syncedAt` frozen and
  // the existing `.toEqual(githubFallback)` tests exact.
  if (!userOk && !reposOk && !eventsOk) return githubFallback;

  const profile = userOk
    ? {
        publicRepos: rawUser.public_repos,
        followers: rawUser.followers,
        following: rawUser.following,
      }
    : {
        publicRepos: githubFallback.publicRepos,
        followers: githubFallback.followers,
        following: githubFallback.following,
      };

  // Empty repos array sums to 0 (vacuous), an honest live-empty value.
  const stars = reposOk
    ? rawRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    : githubFallback.stars;

  // repo is stored as `repo.name` only (a string), never a payload URL — the UI
  // builds hrefs from the fixed github.com origin, so no payload-controlled link
  // target crosses the boundary. Capped at 6; unknown `type` strings are kept.
  const recent = eventsOk
    ? rawEvents.slice(0, 6).map((event) => ({
        id: String(event.id),
        type: event.type,
        repo: event.repo.name,
        createdAt: event.created_at,
      }))
    : githubFallback.recent;

  return {
    source: userOk && reposOk && eventsOk ? 'live' : 'fallback',
    ...profile,
    stars,
    recent,
    syncedAt: new Date().toISOString(),
  };
}
