import type { Loadout } from '@/lib/types/skills';

/**
 * The create-a-class loadout — the single skills source Phase 5 renders. The 37
 * technical skill names (content unchanged) split across primary/secondary/perks;
 * wildcards carry the non-technical differentiators and are NOT counted among the
 * 37. Names only — no icon-library import, no per-skill proficiency.
 */
export const loadout = {
  // Primary weapon: systems and low-level.
  primary: ['C/C++', 'Rust', 'Assembly', 'Go', 'Bash', 'Linux'],
  // Secondary: web and cloud.
  secondary: [
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'TailwindCSS',
    'Flask',
    'Django',
    'FastAPI',
    'Spring Boot',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'Google Cloud',
    'Vercel',
  ],
  // Perks: data/AI plus tools and methods.
  perks: [
    'Python',
    'TensorFlow',
    'PyTorch',
    'Jupyter',
    'OpenAI API',
    'Java',
    'Git',
    'JUnit',
    'pytest',
    'CI/CD',
    'Postman',
    'Jira',
    'Kotlin',
  ],
  // Wildcards: non-technical differentiators (CLASS-03), factual, off the count of 37.
  wildcards: [
    {
      name: 'Philosophy Minor',
      note: 'Minor in Philosophy at the University of Calgary — formal logic and rigorous argument alongside the CS core.',
    },
    {
      name: 'Teaching & Mentorship',
      note: 'Head TA for CPSC 355 and a former Python mentor — turning low-level systems into things people can learn.',
    },
  ],
} satisfies Loadout;
