import type { StaticImageData } from 'next/image';

// Mission (project) shapes for the mission-select cards. Content lives in
// lib/data and conforms to these types via `satisfies` (never a cast).

// Live/at-a-glance performance figures. Every field is optional because each
// mission surfaces a different subset (a Rust server reports request
// throughput; an ML project reports iteration counts).
export interface ProjectMetrics {
  requests?: number;
  responseTime?: number;
  cacheReduction?: number;
  performanceGain?: number;
  iterations?: number;
}

// Mission classification used to filter/group cards. `security` is reserved for
// a future mission; no current project uses it.
export type ProjectCategory =
  | 'performance'
  | 'systems'
  | 'ai'
  | 'web'
  | 'security'
  | 'education';

export interface Project {
  name: string;
  description: string;
  fullDescription?: string;
  // Static import (StaticImageData), never a string path: a missing image file
  // becomes a build error instead of a silent runtime 404 (DATA-03).
  // Optional: a mission without captured art renders the designed hatched
  // "AWAITING VISUAL FEED" placeholder instead of invented artwork.
  image?: StaticImageData;
  github?: string;
  live?: string;
  tech: string[];
  featured: boolean;
  // A string key resolved to an SVG/component in the UI layer. Replaces the
  // ported `icon: LucideIcon` so the data layer imports no icon library.
  insigniaId: string;
  metrics?: string;
  liveMetrics?: ProjectMetrics;
  category?: ProjectCategory;
  githubRepo?: { owner: string; repo: string };
}
