import { describe, expect, it } from 'vitest';
import {
  getFeaturedProjects,
  getProjectByName,
  projects,
} from '@/lib/data/projects';

describe('projects data', () => {
  it('holds the 17 showcased missions (2026-07 roster expansion)', () => {
    expect(projects).toHaveLength(17);
  });

  it('marks exactly 9 missions as featured', () => {
    expect(getFeaturedProjects()).toHaveLength(9);
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

  it('carries the six roster-expansion ops with README-traceable facts', () => {
    expect(getProjectByName('Lattice')?.metrics).toContain('CDCL SAT');
    expect(getProjectByName('Whittle')?.category).toBe('ai');
    expect(getProjectByName('Credence')?.metrics).toContain('3 inference backends');
    expect(getProjectByName('Regex FSM')?.live).toBe('https://regex-fsm.vercel.app');
    expect(getProjectByName('Regex FSM')?.metrics).toContain('1181 tests');
    expect(getProjectByName('Qalam')?.tech).toContain('AArch64 Assembly');
    expect(getProjectByName('Cloud Practitioner Prep')?.metrics).toContain('886 original questions');
    // No invented repo links: the six new ops only claim deployments the
    // READMEs state.
    expect(getProjectByName('Lattice')?.github).toBeUndefined();
    expect(getProjectByName('Whittle')?.github).toBeUndefined();
    expect(getProjectByName('Qalam')?.github).toBeUndefined();
  });

  it('carries the arcade-drop ops with README-traceable facts', () => {
    expect(getProjectByName('Deadzone')?.tech).toContain('AArch64 Assembly');
    expect(getProjectByName('Deadzone')?.featured).toBe(true);
    expect(getProjectByName('QEMU MCP Server')?.metrics).toContain('17 MCP tools');
    expect(getProjectByName('BinDiff MCP')?.metrics).toContain('10 tools');
    // no invented links here either
    expect(getProjectByName('Deadzone')?.github).toBeUndefined();
    expect(getProjectByName('QEMU MCP Server')?.live).toBeUndefined();
    expect(getProjectByName('BinDiff MCP')?.github).toBeUndefined();
  });

  it('gives every mission a unique url-stable slug', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(projects.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
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
