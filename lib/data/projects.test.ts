import { describe, expect, it } from 'vitest';
import {
  getFeaturedProjects,
  getProjectByName,
  projects,
} from '@/lib/data/projects';

describe('projects data', () => {
  it('holds the 8 showcased missions (2026-07 rotation)', () => {
    expect(projects).toHaveLength(8);
  });

  it('marks exactly 6 missions as featured', () => {
    expect(getFeaturedProjects()).toHaveLength(6);
  });

  it('carries the current rotation and none of the retired ops', () => {
    expect(getProjectByName('Peregrine')).toBeDefined();
    expect(getProjectByName('AArch64 Playground')).toBeDefined();
    expect(getProjectByName('Dossier')?.live).toContain('vercel.app');
    expect(getProjectByName('Qala')?.category).toBe('systems');
    // Retired: FastMathExt (superseded by Peregrine) and the old team project.
    expect(getProjectByName('FastMathExt')).toBeUndefined();
    expect(getProjectByName('Self-Checkout Station Software')).toBeUndefined();
    // Corrections: Budget Buddy has no deployment; every op ships map art.
    expect(getProjectByName('Budget Buddy')?.live).toBeUndefined();
    for (const p of projects) expect(p.image).toBeDefined();
  });

  it('gives every mission a string insigniaId (no icon-library import)', () => {
    for (const project of projects) {
      expect(typeof project.insigniaId).toBe('string');
      expect(project.insigniaId.length).toBeGreaterThan(0);
    }
  });

  it('resolves every image to a static art import, not a bare path', () => {
    for (const project of projects) {
      // A StaticImageData object exposes a `src` string; a bare path string
      // would not — this proves the DATA-03 static-import contract.
      if (project.image === undefined) continue;
      expect(project.image).toBeTypeOf('object');
      expect(typeof project.image.src).toBe('string');
    }
  });

  it('finds a mission by name', () => {
    expect(getProjectByName('Rust HTTP Server')).toBeDefined();
  });
});
