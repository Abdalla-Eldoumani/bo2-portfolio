import { afterEach, describe, expect, it, vi } from 'vitest';
import { getGitHubStats } from './github';
import { githubFallback } from '@/lib/data/github-fallback';

// The network is always mocked: these tests exercise the guard/fallback branches
// in isolation and must never hit the real GitHub API (that path is verified end
// to end in Phase 8). `server-only` is neutralized by the vitest.config alias, so
// importing the server-only module here does not throw.
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type StubResponse = {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
};

function ok(body: unknown): StubResponse {
  return { ok: true, status: 200, json: async () => body };
}

// A global-failure response: every surface that receives it degrades. Used both
// as the explicit "all surfaces down" stub and as the default for any surface a
// per-URL test leaves unspecified.
const FAIL: StubResponse = { ok: false, status: 403, json: async () => ({}) };

// Original single-response harness: returns the SAME response for every fetch, so
// all three surfaces (profile / repos / events) see it. This is the correct shape
// for the whole-payload failure branches (403 / malformed / null), where every
// surface degrades and the composite must equal the committed fallback verbatim.
function stubFetch(response: StubResponse) {
  vi.stubGlobal('fetch', vi.fn(async () => response));
}

// Per-URL harness: branch on the fetch target so each surface can be stubbed
// independently. /events and /repos are matched before falling through to the
// profile (/users) surface. An unspecified surface defaults to FAIL so a test can
// name only the surfaces it cares about.
function stubByUrl(
  surfaces: { users?: StubResponse; repos?: StubResponse; events?: StubResponse } = {},
) {
  const { users = FAIL, repos = FAIL, events = FAIL } = surfaces;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes('/events')) return events;
      if (u.includes('/repos')) return repos;
      return users;
    }),
  );
}

const validUser = {
  public_repos: 42,
  followers: 30,
  following: 20,
  created_at: '2020-01-01T00:00:00Z',
};

const validRepos = [
  { stargazers_count: 10 },
  { stargazers_count: 5 },
  { stargazers_count: 0 },
];

const validEvents = [
  { id: 1, type: 'PushEvent', repo: { name: 'Abdalla-Eldoumani/a' }, created_at: '2026-07-08T00:00:00Z' },
  { id: 2, type: 'WatchEvent', repo: { name: 'Abdalla-Eldoumani/b' }, created_at: '2026-07-07T00:00:00Z' },
];

describe('getGitHubStats', () => {
  it('maps valid profile + repos + events to live stats', async () => {
    stubByUrl({ users: ok(validUser), repos: ok(validRepos), events: ok(validEvents) });

    const stats = await getGitHubStats();

    expect(stats.source).toBe('live');
    expect(stats.publicRepos).toBe(42);
    expect(stats.followers).toBe(30);
    expect(stats.following).toBe(20);
    expect(stats.stars).toBe(15);
    expect(stats.recent.length).toBeGreaterThan(0);
  });

  it('sums stargazers_count across a valid repos array', async () => {
    stubByUrl({ users: ok(validUser), repos: ok(validRepos), events: ok(validEvents) });

    expect((await getGitHubStats()).stars).toBe(15);
  });

  it('treats an empty repos array as live-empty (stars 0)', async () => {
    stubByUrl({ users: ok(validUser), repos: ok([]), events: ok(validEvents) });

    const stats = await getGitHubStats();
    expect(stats.stars).toBe(0);
    expect(stats.source).toBe('live');
  });

  it('treats an empty events array as live-empty (recent [])', async () => {
    stubByUrl({ users: ok(validUser), repos: ok(validRepos), events: ok([]) });

    const stats = await getGitHubStats();
    expect(stats.recent).toEqual([]);
    expect(stats.source).toBe('live');
  });

  it('degrades only stars when repos is rejected (profile + events stay live)', async () => {
    stubByUrl({ users: ok(validUser), repos: ok({ not: 'an array' }), events: ok(validEvents) });

    const stats = await getGitHubStats();
    expect(stats.source).toBe('fallback');
    expect(stats.publicRepos).toBe(42);
    expect(stats.stars).toBe(githubFallback.stars);
    expect(stats.recent.length).toBeGreaterThan(0);
    expect(stats.recent[0].repo).toBe('Abdalla-Eldoumani/a');
  });

  it('degrades only recent when events is rejected (profile + repos stay live)', async () => {
    stubByUrl({ users: ok(validUser), repos: ok(validRepos), events: ok({ not: 'an array' }) });

    const stats = await getGitHubStats();
    expect(stats.source).toBe('fallback');
    expect(stats.publicRepos).toBe(42);
    expect(stats.stars).toBe(15);
    expect(stats.recent).toEqual(githubFallback.recent);
  });

  it('rejects an events payload whose item is missing an id (degrades the surface)', async () => {
    stubByUrl({
      users: ok(validUser),
      repos: ok(validRepos),
      events: ok([
        { type: 'PushEvent', repo: { name: 'Abdalla-Eldoumani/x' }, created_at: '2026-07-08T00:00:00Z' },
      ]),
    });

    const stats = await getGitHubStats();
    expect(stats.recent).toEqual(githubFallback.recent);
    expect(stats.source).toBe('fallback');
  });

  it('anchors syncedAt to the fallback stamp when the events surface degrades', async () => {
    stubByUrl({ users: ok(validUser), repos: ok(validRepos), events: ok({ not: 'an array' }) });

    const stats = await getGitHubStats();
    expect(stats.syncedAt).toBe(githubFallback.syncedAt);
  });

  it('keeps a fresh syncedAt when events are live but repos degrade', async () => {
    stubByUrl({ users: ok(validUser), repos: ok({ not: 'an array' }), events: ok(validEvents) });

    const stats = await getGitHubStats();
    expect(stats.syncedAt).not.toBe(githubFallback.syncedAt);
  });

  it('keeps an event row whose type is unknown', async () => {
    stubByUrl({
      users: ok(validUser),
      repos: ok(validRepos),
      events: ok([
        { id: 9, type: 'MysteryEvent', repo: { name: 'Abdalla-Eldoumani/z' }, created_at: '2026-07-08T00:00:00Z' },
      ]),
    });

    const stats = await getGitHubStats();
    expect(stats.recent.some((r) => r.type === 'MysteryEvent')).toBe(true);
  });

  it('caps recent at 6 rows when the events payload is larger', async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      type: 'PushEvent',
      repo: { name: `Abdalla-Eldoumani/r${i}` },
      created_at: '2026-07-08T00:00:00Z',
    }));
    stubByUrl({ users: ok(validUser), repos: ok(validRepos), events: ok(many) });

    expect((await getGitHubStats()).recent).toHaveLength(6);
  });

  it('returns the committed fallback on a 403 rate-limit', async () => {
    stubFetch({ ok: false, status: 403, json: async () => ({}) });

    expect(await getGitHubStats()).toEqual(githubFallback);
  });

  it('returns the committed fallback on a malformed shape', async () => {
    stubFetch({ ok: true, status: 200, json: async () => ({ public_repos: 'nope' }) });

    expect(await getGitHubStats()).toEqual(githubFallback);
  });

  it('returns the committed fallback on a null body', async () => {
    stubFetch({ ok: true, status: 200, json: async () => null });

    expect(await getGitHubStats()).toEqual(githubFallback);
  });

  it('returns the committed fallback when the profile is an array while repos + events fail', async () => {
    // `[]` is VALID (live-empty) for repos/events, so it can only degrade the
    // profile surface. Stub it for /users ONLY, with repos + events failing, so
    // all three surfaces degrade and the composite equals the fallback verbatim.
    stubByUrl({ users: ok([]) });

    expect(await getGitHubStats()).toEqual(githubFallback);
  });

  it('returns the committed fallback when fetch throws (network)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ENOTFOUND');
      }),
    );

    expect(await getGitHubStats()).toEqual(githubFallback);
  });
});
