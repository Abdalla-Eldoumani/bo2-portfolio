import type { Experience, Education } from '@/lib/types/experience';

/**
 * Experience roles + education — the rank ladder rendered as rank-up events,
 * newest first. Content follows the approved superset rule (2026-07 resume
 * sync): resume-new roles are added, site-only detail is kept. Each role
 * carries a string `insigniaId` resolved to enamel rank art in the UI.
 */
export const experiences = [
  {
    role: 'Undergraduate Researcher',
    company: 'University of Calgary',
    location: 'Calgary, Alberta',
    duration: 'May 2026 – Present',
    type: 'Academic',
    description:
      'Two PURE Award research projects: proactive task replication for extreme edge computing, and the AArch64 Playground — a browser-based ARMv8 emulator and visual debugger now used as a teaching aid.',
    achievements: [
      'Model proactive task replication for extreme edge computing as a reputation-weighted MILP across unreliable devices.',
      'Build the AArch64 Playground — a browser ARMv8 emulator and visual debugger in Rust/WebAssembly and Next.js, validated by 790+ automated tests.',
    ],
    skills: [
      'Rust',
      'WebAssembly',
      'MILP Optimization',
      'Edge Computing',
      'Next.js',
    ],
    insigniaId: 'rank-researcher',
  },
  {
    role: 'Teaching Assistant',
    company: 'University of Calgary',
    location: 'Calgary, Alberta',
    duration: 'September 2025 – April 2026',
    type: 'Academic',
    description:
      'Head TA for CPSC 355 and tutorial lead for CPSC 413, coordinating TAs and teaching computer architecture, low-level programming, and algorithm design.',
    achievements: [
      'Head TA for 120+ students, coordinating a 5-TA team; owned assignment design and the grading workflow.',
      'Built Gradescope autograders (Python, Docker, QEMU); authored 12 tutorial decks and 100+ practice problems.',
      'Taught labs on computer architecture, C, and ARMv8 assembly covering memory management, register allocation, and ISA.',
      'Led CPSC 413 tutorials on algorithm design: greedy, divide-and-conquer, dynamic programming, and NP-completeness.',
    ],
    skills: [
      'Computer Architecture',
      'C Programming',
      'ARMv8 Assembly',
      'Autograders',
      'Algorithm Design',
      'Teaching',
      'Debugging',
      'Code Review',
      'Mentorship',
    ],
    insigniaId: 'rank-instructor',
  },
  {
    role: 'AI Training Specialist',
    company: 'Outlier',
    location: 'Remote, Canada',
    duration: 'October 2024 - September 2025',
    type: 'Remote',
    description:
      'Evaluating and improving AI model performance through systematic analysis of code generation quality and algorithmic solutions.',
    achievements: [
      'Evaluated AI-generated Python code across 500+ dual-response scenarios, analyzing algorithm efficiency and optimization.',
      'Tested AI solutions for functional correctness and performance, documenting comparative analysis with technical feedback.',
      'Identified bugs and optimization opportunities in diverse programming tasks including data structures and algorithms.',
    ],
    skills: [
      'Python',
      'AI Evaluation',
      'Algorithm Analysis',
      'Code Review',
      'Performance Testing',
      'Technical Documentation',
      'Quality Assurance',
    ],
    insigniaId: 'rank-specialist',
  },
  {
    role: 'Software Engineering Fellow',
    company: 'Headstarter AI',
    location: 'Remote, Canada',
    duration: 'July 2024 – September 2024',
    type: 'Fellowship',
    description:
      'Intensive software engineering fellowship focusing on AI projects, hackathons, and scalable platform development.',
    achievements: [
      'Built and deployed 5 AI-powered applications using Python and Docker, completing intensive hackathons with teams.',
      'Developed a capstone project serving 1,000+ users using React.js, TypeScript, and modern web frameworks.',
    ],
    skills: [
      'Python',
      'Docker',
      'React.js',
      'TypeScript',
      'Machine Learning',
      'Team Leadership',
      'Agile Development',
      'Rapid Prototyping',
    ],
    insigniaId: 'rank-fellow',
  },
  {
    role: 'Python Mentor',
    company: 'Al Oruba International School',
    location: 'Riyadh, Saudi Arabia',
    duration: 'July 2021 – July 2022',
    type: 'Mentorship',
    description:
      'Led comprehensive Python programming mentorship program for high school students, focusing on practical application and collaborative learning.',
    achievements: [
      'Led programming workshops for 30+ high school students, teaching Python fundamentals and algorithm implementation.',
      'Designed hands-on coding exercises and project-based assignments improving student programming confidence.',
    ],
    skills: [
      'Python',
      'Teaching',
      'Curriculum Development',
      'Workshop Facilitation',
      'Mentorship',
      'Algorithm Design',
    ],
    insigniaId: 'rank-mentor',
  },
] satisfies readonly Experience[];

export const education = {
  degree: 'B.Sc. Computer Science',
  minor: 'Minor in Philosophy',
  institution: 'University of Calgary',
  location: 'Calgary, Alberta',
  duration: 'Sep 2022 – Jun 2027',
  gpa: '3.6/4.0',
  honors: "Dean's List (2023-2024, 2024-2025)",
  description:
    'Comprehensive computer science education with philosophical foundations, focusing on low-level systems, algorithms, and software engineering principles.',
  highlights: [
    'Computing Machinery I & II (C, ARMv8 Assembly, Computer Architecture, Embedded Systems)',
    'Principles of Operating Systems, Design & Analysis of Algorithms, Data Structures & Algorithms',
    'Computer Networks, Database Management Systems, Artificial Intelligence',
    'Computer Security, Network Systems Security, Software Engineering, Reverse Engineering',
  ],
} satisfies Education;

// Helper functions for filtering and resolving experience entries.
export const getExperienceByType = (type: Experience['type']) =>
  experiences.filter((exp) => exp.type === type);

// The open-ended role: its operation window ends in "Present".
export const getCurrentExperience = () =>
  experiences.find((exp) => exp.duration.includes('Present'));

export const getExperienceByCompany = (company: string) =>
  experiences.find((exp) => exp.company === company);
