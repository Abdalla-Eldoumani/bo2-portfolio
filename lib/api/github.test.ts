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

function stubFetch(response: {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}) {
  vi.stubGlobal('fetch', vi.fn(async () => response));
}

describe('getGitHubStats', () => {
  it('maps a valid /users payload to live stats', async () => {
    stubFetch({
      ok: true,
      status: 200,
      json: async () => ({
        public_repos: 42,
        followers: 30,
        following: 20,
        created_at: '2020-01-01T00:00:00Z',
      }),
    });

    const stats = await getGitHubStats();

    expect(stats.source).toBe('live');
    expect(stats.publicRepos).toBe(42);
    expect(stats.followers).toBe(30);
    expect(stats.following).toBe(20);
  });

  it('returns the committed fallback on a 403 rate-limit', async () => {
    stubFetch({ ok: false, status: 403, json: async () => ({}) });

    expect(await getGitHubStats()).toEqual(githubFallback);
  });

  it('returns the committed fallback on a malformed shape', async () => {
    stubFetch({ ok: true, status: 200, json: async () => ({ public_repos: 'nope' }) });

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
