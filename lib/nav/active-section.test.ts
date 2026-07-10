import { describe, it, expect } from 'vitest';
import { resolveActiveSection, type ObservedEntry } from './active-section';

// Builds an ObservedEntry with sane defaults so each case names only what it varies.
function entry(
  id: string,
  isIntersecting: boolean,
  centerDistance = 0,
): ObservedEntry {
  return { id, isIntersecting, centerDistance };
}

describe('resolveActiveSection', () => {
  it('returns the id of the sole intersecting entry', () => {
    const entries = [
      entry('lobby', false, 400),
      entry('dossier', true, 12),
      entry('loadout', false, 800),
    ];
    expect(resolveActiveSection(entries)).toBe('dossier');
  });

  it('keeps the previous id when nothing is in the band (fast programmatic scroll)', () => {
    const entries = [
      entry('lobby', false, 500),
      entry('dossier', false, 900),
    ];
    expect(resolveActiveSection(entries, 'dossier')).toBe('dossier');
  });

  it('returns undefined when the band is empty and there is no previous id', () => {
    const entries = [entry('lobby', false, 500), entry('dossier', false, 900)];
    expect(resolveActiveSection(entries)).toBeUndefined();
  });

  it('picks the entry nearest the band center when two overlap the band', () => {
    const entries = [
      entry('lobby', true, 90),
      entry('dossier', true, 20),
    ];
    expect(resolveActiveSection(entries)).toBe('dossier');
  });

  it('returns a tall sole intersector even when its center is far from the band middle', () => {
    // A section taller than the band is intersecting with a large centerDistance;
    // as the only intersector it still wins.
    const entries = [
      entry('lobby', false, 30),
      entry('record', true, 620),
      entry('comms', false, 50),
    ];
    expect(resolveActiveSection(entries)).toBe('record');
  });

  it('breaks centerDistance ties by array (DOM) order', () => {
    const entries = [
      entry('lobby', true, 40),
      entry('dossier', true, 40),
    ];
    expect(resolveActiveSection(entries)).toBe('lobby');
  });

  it('resolves an entry set with no intersectors (absent/locked target) to undefined without throwing', () => {
    expect(resolveActiveSection([])).toBeUndefined();
    expect(resolveActiveSection([entry('missions', false, 300)])).toBeUndefined();
  });
});
