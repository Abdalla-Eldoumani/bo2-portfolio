import { describe, expect, it } from 'vitest';
import {
  getFeaturedProjects,
  getProjectByName,
  projects,
} from '@/lib/data/projects';

describe('projects data', () => {
  it('holds all 10 missions (2026-07 resume superset)', () => {
    expect(projects).toHaveLength(10);
  });

  it('marks exactly 6 missions as featured', () => {
    expect(getFeaturedProjects()).toHaveLength(6);
  });

  it('carries the resume-sync additions', () => {
    expect(getProjectByName('Peregrine')).toBeDefined();
    expect(getProjectByName('Qala')?.category).toBe('systems');
  });

  it('gives every mission a string insigniaId (no icon-library import)', () => {
    for (const project of projects) {
      expect(typeof project.insigniaId).toBe('string');
      expect(project.insigniaId.length).toBeGreaterThan(0);
    }
  });

  it('resolves every provided image to a static import, not a bare path', () => {
    for (const project of projects) {
      // A StaticImageData object exposes a `src` string; a bare `/images/x.png`
      // path string would not — this proves the DATA-03 static-import contract.
      // `image` is optional: art-less missions render the designed placeholder.
      if (project.image === undefined) continue;
      expect(project.image).toBeTypeOf('object');
      expect(typeof project.image.src).toBe('string');
    }
  });

  it('finds a mission by name', () => {
    expect(getProjectByName('Rust HTTP Server')).toBeDefined();
  });
});
