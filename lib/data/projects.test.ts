import { describe, expect, it } from 'vitest';
import {
  getFeaturedProjects,
  getProjectByName,
  projects,
} from '@/lib/data/projects';

describe('projects data', () => {
  it('holds all 8 missions', () => {
    expect(projects).toHaveLength(8);
  });

  it('marks exactly 5 missions as featured', () => {
    expect(getFeaturedProjects()).toHaveLength(5);
  });

  it('gives every mission a string insigniaId (no icon-library import)', () => {
    for (const project of projects) {
      expect(typeof project.insigniaId).toBe('string');
      expect(project.insigniaId.length).toBeGreaterThan(0);
    }
  });

  it('resolves every image to a static import, not a bare path string', () => {
    for (const project of projects) {
      // A StaticImageData object exposes a `src` string; a bare `/images/x.png`
      // path string would not — this proves the DATA-03 static-import contract.
      expect(project.image).toBeTypeOf('object');
      expect(typeof project.image.src).toBe('string');
    }
  });

  it('finds a mission by name', () => {
    expect(getProjectByName('Rust HTTP Server')).toBeDefined();
  });
});
