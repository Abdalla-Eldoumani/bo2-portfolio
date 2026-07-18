import { describe, expect, it } from 'vitest';
import {
  getFeaturedProjects,
  getProjectByName,
  projects,
} from '@/lib/data/projects';

describe('projects data', () => {
  it('holds the 20 showcased missions (2026-07 roster expansion)', () => {
    expect(projects).toHaveLength(20);
  });

  it('carries the encore ops with README-traceable facts', () => {
    expect(getProjectByName('DSAV')?.metrics).toContain('12,249 lines');
    expect(getProjectByName('Termpilot')?.metrics).toContain('7 tools');
    expect(getProjectByName('ARM String Ops')?.metrics).toContain('27-42 GB/s');
    expect(getProjectByName('DSAV')?.github).toContain('github.com/Abdalla-Eldoumani/dsav');
    expect(getProjectByName('Termpilot')?.github).toContain('termpilot');
    expect(getProjectByName('Termpilot')?.live).toBeUndefined();
    expect(getProjectByName('ARM String Ops')?.github).toContain('arm-string-ops');
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
    // Source links follow repo visibility (verified against GitHub
    // 2026-07-18): public repos link source, private ones never do.
    expect(getProjectByName('Lattice')?.github).toContain('github.com/Abdalla-Eldoumani/lattice');
    expect(getProjectByName('Qalam')?.github).toContain('github.com/Abdalla-Eldoumani/qalam');
    expect(getProjectByName('Regex FSM')?.github).toContain('github.com/Abdalla-Eldoumani/regex-fsm');
    // whittle and the playground are private; cloud-prep is private but deployed
    expect(getProjectByName('Whittle')?.github).toBeUndefined();
    expect(getProjectByName('AArch64 Playground')?.github).toBeUndefined();
    expect(getProjectByName('Cloud Practitioner Prep')?.github).toBeUndefined();
    expect(getProjectByName('Cloud Practitioner Prep')?.live).toContain('vercel.app');
  });

  it('carries the arcade-drop ops with README-traceable facts', () => {
    expect(getProjectByName('Deadzone')?.tech).toContain('AArch64 Assembly');
    expect(getProjectByName('Deadzone')?.featured).toBe(true);
    expect(getProjectByName('QEMU MCP Server')?.metrics).toContain('17 MCP tools');
    expect(getProjectByName('BinDiff MCP')?.metrics).toContain('10 tools');
    // public repos, no deployments
    expect(getProjectByName('Deadzone')?.github).toContain('github.com/Abdalla-Eldoumani/deadzone');
    expect(getProjectByName('QEMU MCP Server')?.github).toContain('qemu-mcp-server');
    expect(getProjectByName('QEMU MCP Server')?.live).toBeUndefined();
    expect(getProjectByName('BinDiff MCP')?.github).toContain('bindiff-mcp');
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
