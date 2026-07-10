import { describe, it, expect } from 'vitest';
import { navigation } from '@/lib/data/navigation';
import { isLive, deriveNav } from './live-sections';

const ALL_IDS = navigation.map((n) => n.id);

describe('isLive', () => {
  it('is true only when the id is in the present list', () => {
    expect(isLive('lobby', ['lobby', 'dossier'])).toBe(true);
    expect(isLive('loadout', ['lobby', 'dossier'])).toBe(false);
  });

  it('is false for an empty present list', () => {
    expect(isLive('lobby', [])).toBe(false);
  });
});

describe('deriveNav', () => {
  it('returns one entry per nav item in page order', () => {
    const derived = deriveNav(navigation, ALL_IDS);
    expect(derived).toHaveLength(7);
    expect(derived.map((d) => d.id)).toEqual([
      'lobby',
      'dossier',
      'loadout',
      'missions',
      'record',
      'scoreboard',
      'comms',
    ]);
  });

  it('marks every entry live when all ids are present (v1.0.0 released state)', () => {
    const derived = deriveNav(navigation, ALL_IDS);
    expect(derived.every((d) => d.live)).toBe(true);
  });

  it('marks exactly the present subset live and the rest locked', () => {
    const derived = deriveNav(navigation, ['lobby', 'dossier']);
    const live = derived.filter((d) => d.live).map((d) => d.id);
    const locked = derived.filter((d) => !d.live).map((d) => d.id);
    expect(live).toEqual(['lobby', 'dossier']);
    expect(locked).toEqual([
      'loadout',
      'missions',
      'record',
      'scoreboard',
      'comms',
    ]);
  });

  it('marks all entries locked for an empty present list without throwing', () => {
    const derived = deriveNav(navigation, []);
    expect(derived.every((d) => !d.live)).toBe(true);
  });

  it('preserves each original field alongside the live flag', () => {
    const derived = deriveNav(navigation, ['lobby']);
    const lobby = derived[0];
    expect(lobby).toMatchObject({
      id: 'lobby',
      label: 'Lobby',
      href: '#lobby',
      live: true,
    });
  });
});
