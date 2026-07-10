import { describe, expect, it } from 'vitest';
import {
  education,
  experiences,
  getCurrentExperience,
} from '@/lib/data/experience';
import { loadout } from '@/lib/data/skills';
import { navigation } from '@/lib/data/navigation';

describe('experience data', () => {
  it('holds 4 roles and a single education entry', () => {
    expect(experiences).toHaveLength(4);
    expect(education.degree).toBeTruthy();
  });

  it('resolves the open-ended role as current (PRESENT)', () => {
    const current = getCurrentExperience();
    expect(current).toBeDefined();
    expect(current?.duration).toContain('Present');
    expect(current?.role).toBe('Teaching Assistant');
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
  it('lists all 7 lobby sections', () => {
    expect(navigation).toHaveLength(7);
  });

  it('gives every item a label, subtitle, and #-anchored href', () => {
    for (const item of navigation) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.subtitle.length).toBeGreaterThan(0);
      expect(item.href.startsWith('#')).toBe(true);
      expect(item.href).toBe(`#${item.id}`);
    }
  });
});
