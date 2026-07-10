import type { Bio } from '@/lib/types/bio';

/**
 * Single source for the service-record dossier's framing fields and bio prose.
 * Facts are verbatim; only the classified-file framing labels are theme copy.
 *
 * This module owns ONLY what has no home elsewhere: station, origin, status,
 * a decorative file reference, the clearance tag, and the two prose paragraphs.
 * Identity (name, role, callsign handle) stays in lib/site-config.ts and
 * education/honors stay in lib/data/experience.ts `education` — the wave-2
 * dossier reads those from their existing modules; never re-hardcode them here.
 *
 * Prose is split into emphasis runs: an `{ em }` run lifts to --color-ink at
 * render, a `{ text }` run stays --color-ink-secondary. Splitting adds no facts.
 */
export const bio = {
  station: 'Calgary, Alberta',
  origin: 'Riyadh, Saudi Arabia',
  status: 'Active Duty',
  fileRef: 'FILE No. SR-0427 // REC 2022–2027',
  clearanceTag: 'CLEARANCE: GRANTED',
  prose: [
    [
      { text: "I'm " },
      { em: 'Abdalla Eldoumani' },
      {
        text:
          ', a Computer Science student at the University of Calgary with a minor in Philosophy. I moved from Saudi Arabia to Calgary to understand how computers work — from transistors to distributed systems.',
      },
    ],
    [
      { text: 'My work spans the full stack: high-performance servers in ' },
      { em: 'Rust' },
      { text: ', matrix math in ' },
      { em: 'C++' },
      { text: ', and modern web apps in ' },
      { em: 'TypeScript' },
      { text: ' and ' },
      { em: 'React' },
      {
        text:
          '. As a TA for CPSC 355, I teach assembly and computer architecture — explaining how the abstractions we rely on actually work.',
      },
    ],
  ],
} satisfies Bio;
