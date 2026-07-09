// Experience (role) + education shapes for the Phase 7 rank ladder. The old
// per-entry presentational palette fields are intentionally absent: BO2 styling
// derives from `type`/`rank`, not stored color strings.

export type ExperienceType = 'Academic' | 'Remote' | 'Fellowship' | 'Mentorship';

export interface Experience {
  role: string;
  company: string;
  location: string;
  duration: string;
  type: ExperienceType;
  description: string;
  achievements: string[];
  skills: string[];
  // Optional theme hooks for the ladder: a string insignia key (resolved in the
  // UI, no icon-lib import) and a role-to-rank label.
  insigniaId?: string;
  rank?: string;
}

export interface Education {
  degree: string;
  minor?: string;
  institution: string;
  location: string;
  duration: string;
  gpa: string;
  honors?: string;
  description: string;
  highlights: string[];
}
