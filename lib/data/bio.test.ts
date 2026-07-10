import { describe, expect, it } from 'vitest';
import { bio } from '@/lib/data/bio';
import type { ProseRun } from '@/lib/types/bio';

// Flatten a run to its rendered text regardless of emphasis, so a paragraph's
// facts can be asserted independent of where the { em } splits fall.
const runText = (run: ProseRun) => ('em' in run ? run.em : run.text);
const paragraphText = (runs: readonly ProseRun[]) => runs.map(runText).join('');

describe('dossier bio', () => {
  it('holds exactly two prose paragraphs, each with an emphasis run', () => {
    expect(bio.prose).toHaveLength(2);
    for (const paragraph of bio.prose) {
      expect(paragraph.some((run) => 'em' in run)).toBe(true);
    }
  });

  it('keeps paragraph one verbatim (origin, institution, minor)', () => {
    const text = paragraphText(bio.prose[0]);
    expect(text).toContain('University of Calgary');
    expect(text).toContain('Philosophy');
  });

  it('keeps paragraph two verbatim (stack, teaching)', () => {
    const text = paragraphText(bio.prose[1]);
    expect(text).toContain('Rust');
    expect(text).toContain('C++');
    expect(text).toContain('TypeScript');
    expect(text).toContain('React');
    expect(text).toContain('CPSC 355');
  });

  it('carries the contracted framing fields', () => {
    expect(bio.station).toBe('Calgary, Alberta');
    expect(bio.origin).toBe('Riyadh, Saudi Arabia');
    expect(bio.status).toBe('Active Duty');
    expect(bio.clearanceTag).toBe('CLEARANCE: GRANTED');
  });
});
