import { describe, expect, it } from 'vitest';
import {
  education,
  experiences,
  getCurrentExperience,
} from '@/lib/data/experience';
import { loadout } from '@/lib/data/skills';
import { navigation } from '@/lib/data/navigation';

describe('experience data', () => {
  it('holds 5 roles (2026-07 resume superset) and a single education entry', () => {
    expect(experiences).toHaveLength(5);
    expect(education.degree).toBeTruthy();
  });

  it('resolves the open-ended role as current (PRESENT)', () => {
    const current = getCurrentExperience();
    expect(current).toBeDefined();
    expect(current?.duration).toContain('Present');
    expect(current?.role).toBe('Undergraduate Researcher');
  });

  it('orders the ladder newest-first with the current role on top', () => {
    expect(experiences[0].duration).toContain('Present');
    expect(experiences[experiences.length - 1].duration).toContain('2021');
  });
});

describe('skills loadout', () => {
  it('carries exactly 37 technical skills across the three slots', () => {
    const technical =
      loadout.primary.length + loadout.secondary.length + loadout.perks.length;
    expect(technical).toBe(37);
  });

  it('lists every technical skill exactly once (no drop or duplicate)', () => {
    const all = [...loadout.primary, ...loadout.secondary, ...loadout.perks];
    expect(new Set(all).size).toBe(all.length);
  });

  it('carries at least the two non-technical wildcard differentiators', () => {
    expect(loadout.wildcards.length).toBeGreaterThanOrEqual(2);
    for (const card of loadout.wildcards) {
      expect(card.name).toBeTruthy();
      expect(card.note).toBeTruthy();
    }
  });
});

describe('navigation manifest', () => {
  it('lists the 7 screen destinations (the lobby itself is separate)', () => {
    expect(navigation).toHaveLength(7);
    expect(navigation[navigation.length - 1].id).toBe('about');
  });

  it('gives every item a label, subtitle, and a route href', () => {
    for (const item of navigation) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.subtitle.length).toBeGreaterThan(0);
      expect(item.href.startsWith('/')).toBe(true);
      expect(item.href).toBe(`/${item.id}`);
    }
  });
});
