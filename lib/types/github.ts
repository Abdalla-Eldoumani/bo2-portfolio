// GitHub scoreboard shapes (Phase 8). The server-only module in lib/api resolves
// to GitHubStats and never throws to the client; `source` lets the UI show live
// vs cached data without a separate flag.

// One row of recent public activity (the killfeed).
export interface ActivityRow {
  id: string;
  type: string;
  repo: string;
  createdAt: string;
}

export interface GitHubStats {
  // Discriminant: 'live' when the API responded and validated; 'fallback' when
  // the committed snapshot was served (rate-limit / network / shape failure).
  source: 'live' | 'fallback';
  publicRepos: number;
  followers: number;
  following: number;
  stars: number;
  recent: ActivityRow[];
  syncedAt: string; // ISO timestamp, rendered via formatSynced
}
