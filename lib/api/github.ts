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

// Resolves GitHubStats for the scoreboard and never throws to the caller: on any
// 403 / network / shape failure it returns the committed fallback, so Phase 8
// shows cached values with a "last synced" stamp rather than a spinner or a
// broken panel. `stars` and `recent` are seeded here; Phase 8 extends them via
// their own guarded endpoints.
export async function getGitHubStats(): Promise<GitHubStats> {
  const raw = await safeJson(`${GH}/users/${USER}`);
  if (!isUserPayload(raw)) return githubFallback;

  return {
    source: 'live',
    publicRepos: raw.public_repos,
    followers: raw.followers,
    following: raw.following,
    stars: 0,
    recent: [],
    syncedAt: new Date().toISOString(),
  };
}
