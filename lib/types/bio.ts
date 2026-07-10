// Dossier bio contract for the service-record surface. The prose is stored as
// arrays of emphasis runs so the renderer can lift named terms to --color-ink
// without parsing markup: a `{ text }` run stays --color-ink-secondary, an
// `{ em }` run lifts to --color-ink. Types only — the data conforms via
// `satisfies Bio` in lib/data/bio.ts (never an `as` cast).

export type ProseRun = { text: string } | { em: string };

export interface Bio {
  station: string; // "Calgary, Alberta"
  origin: string; // "Riyadh, Saudi Arabia"
  status: string; // "Active Duty"
  fileRef: string; // decorative mono file code (original flavor, no game wordmark)
  clearanceTag: string; // "CLEARANCE: GRANTED"
  prose: readonly (readonly ProseRun[])[]; // paragraphs → emphasis runs
}
