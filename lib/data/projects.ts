import type { Project } from '@/lib/types/project';

// Map-preview art: original in-house SVG scenes (public/art/maps), imported
// statically so a missing file fails `next build` instead of 404-ing.
import peregrineArt from '@/public/art/maps/peregrine.svg';
import aeosArt from '@/public/art/maps/aeos.svg';
import playgroundArt from '@/public/art/maps/aarch64-playground.svg';
import qalaArt from '@/public/art/maps/qala.svg';
import rustServerArt from '@/public/art/maps/rust-http-server.svg';
import dossierArt from '@/public/art/maps/dossier.svg';
import dustArt from '@/public/art/maps/dust.svg';
import budgetBuddyArt from '@/public/art/maps/budget-buddy.svg';

/**
 * The mission set — the eight showcased operations, strongest first. Every
 * factual claim traces to the July 2026 resume or the project's own README
 * (benchmark figures come from each project's harness); deployments were
 * verified against the author's portfolio data of the same date. Retired from
 * rotation: FastMathExt (superseded by Peregrine), the self-checkout team
 * project, and early hackathon-era sites.
 */
export const projects = [
  {
    name: 'Peregrine',
    description:
      'Heterogeneous linear algebra that picks the right silicon for the shape of the problem: AVX2 SIMD on the CPU, cuBLAS on the GPU, one zero-copy NumPy-compatible API above both.',
    fullDescription:
      'Peregrine routes each operation per machine and per shape — offloading to the GPU only past the measured transfer-cost crossover. On its own harness: 28× NumPy on device-resident float32 matmul, 71× unfused NumPy on fused three-op GPU chains, 3.2× on the CPU path. Methodology and harness live in the repo.',
    image: peregrineArt,
    github: 'https://github.com/Abdalla-Eldoumani/peregrine',
    githubRepo: { owner: 'Abdalla-Eldoumani', repo: 'peregrine' },
    tech: ['C++', 'AVX2', 'CUDA', 'cuBLAS', 'Python', 'NumPy API'],
    featured: true,
    insigniaId: 'silicon',
    category: 'performance',
    metrics: '28× NumPy matmul · 71× fused GPU chains · 3.2× fused CPU chains',
  },
  {
    name: 'AEOS',
    description:
      'A monolithic ARM64 kernel with a windowed desktop, written from scratch: boots EL2 to EL1 by hand, builds its own identity-mapped MMU, schedules preemptively at 100 Hz, and composites a desktop over a VirtIO GPU at 30 frames per second.',
    fullDescription:
      'Buddy allocator and first-fit heap, GICv2 interrupts and the generic timer, a loaded ELF running at EL0 behind a real privilege boundary, four cores online over PSCI, ARP and ICMP answered by its own network stack, eight built-in apps including a vim-style editor and Tetris, 30 shell commands, and a 39-scenario test suite in CI. Deliberately small and honest about its gaps: no kernel W^X, no cross-core preemption, no TCP.',
    image: aeosArt,
    github: 'https://github.com/Abdalla-Eldoumani/aeos',
    githubRepo: { owner: 'Abdalla-Eldoumani', repo: 'aeos' },
    tech: ['C', 'ARMv8 Assembly', 'QEMU', 'VirtIO', 'PSCI'],
    featured: true,
    insigniaId: 'kernel',
    category: 'systems',
    metrics: '4 cores · 100 Hz preemption · 30 FPS desktop',
  },
  {
    name: 'AArch64 Playground',
    description:
      'A browser-based ARM64 emulator and visual debugger, built with a professor and two collaborators under a PURE research award and now used as a teaching aid: paste assembly, step one instruction at a time, watch the registers change their minds.',
    fullDescription:
      'Rust compiled to WebAssembly does the emulation; Next.js renders the debugger. Validated by 790+ automated tests and used as a teaching aid for computer architecture at the University of Calgary.',
    image: playgroundArt,
    live: 'https://aarch64-playground.vercel.app',
    tech: ['Rust', 'WebAssembly', 'Next.js', 'ARMv8'],
    featured: true,
    insigniaId: 'scope',
    category: 'education',
    metrics: '790+ automated tests · CPSC 355 teaching aid',
  },
  {
    name: 'Qala',
    description:
      'A statically typed teaching language where saying is doing: effects like is pure and is io are checked by the compiler, so code is a truthful declaration of behavior. Lexer to typechecker to bytecode VM, plus an ARM64 backend, all in Rust.',
    fullDescription:
      'Qala ships on crates.io with a WebAssembly build powering the in-browser playground. The ARM64 backend compiles to the same assembly taught in CPSC 355 — the language and the AArch64 Playground form a loop: a language built from scratch, stepped in the emulator built alongside it.',
    image: qalaArt,
    github: 'https://github.com/Abdalla-Eldoumani/qala-lang',
    githubRepo: { owner: 'Abdalla-Eldoumani', repo: 'qala-lang' },
    live: 'https://qala-lang.vercel.app',
    tech: ['Rust', 'WebAssembly', 'ARM64', 'Compilers', 'crates.io'],
    featured: true,
    insigniaId: 'forge',
    category: 'systems',
    metrics: 'Language on crates.io · in-browser playground',
  },
  {
    name: 'Rust HTTP Server',
    description:
      'A production-grade server built to hold 10,000+ concurrent connections: JWT auth with role-based access, WebSocket notifications, background jobs with retries, and full-text search with fuzzy matching.',
    fullDescription:
      'Fifteen middleware components, each one written rather than imported. Intelligent caching cuts database load by 60%; sub-10ms response latency under concurrent load, measured against the project readme figures of July 2025.',
    image: rustServerArt,
    github: 'https://github.com/Abdalla-Eldoumani/rust-http-server',
    githubRepo: { owner: 'Abdalla-Eldoumani', repo: 'rust-http-server' },
    tech: ['Rust', 'Axum', 'SQLite', 'WebSocket', 'JWT'],
    featured: true,
    insigniaId: 'server',
    category: 'performance',
    metrics: '10,000+ concurrent · sub-10ms · −60% DB load',
  },
  {
    name: 'Dossier',
    description:
      'Privacy-first PDF toolkit: 42 operations, all local, exposed to humans as a web app and to agents over the Model Context Protocol. Nothing you process ever leaves the machine.',
    fullDescription:
      'A static-export Next.js app whose entire PDF pipeline runs client-side, with the same operations published as an MCP server so agents can drive them. Forty-two operations, zero uploads.',
    image: dossierArt,
    github: 'https://github.com/Abdalla-Eldoumani/dossier',
    githubRepo: { owner: 'Abdalla-Eldoumani', repo: 'dossier' },
    live: 'https://dossier-web-five.vercel.app',
    tech: ['TypeScript', 'MCP', 'Next.js', 'Static Export'],
    featured: true,
    insigniaId: 'vault',
    category: 'web',
    metrics: '42 operations · fully client-side',
  },
  {
    name: 'DUST',
    description:
      'A multiplayer game about digging through a decaying internet, built in 24 hours with real-time state sync in both competitive and cooperative modes.',
    fullDescription:
      'Players become digital archaeologists uncovering lost data and forgotten websites in a fictional, crumbling internet. Real-time multiplayer is powered by Convex with authentication via Clerk.',
    image: dustArt,
    github: 'https://github.com/Abdalla-Eldoumani/DUST',
    githubRepo: { owner: 'Abdalla-Eldoumani', repo: 'DUST' },
    live: 'https://dust-mu.vercel.app',
    tech: ['Next.js', 'TypeScript', 'Convex', 'Clerk Auth'],
    featured: false,
    insigniaId: 'ruin',
    category: 'web',
    metrics: 'Calgary Hacks 2026 · real-time multiplayer',
  },
  {
    name: 'Budget Buddy',
    description:
      'Budget tracking, live stock data, and growth projections for the 70% of young Canadians who avoid investing entirely. Built at CalgaryHacks 24.',
    fullDescription:
      'A full-stack financial platform with real-time stock data across sectors, projection tools for investment planning, and budget tracking behind modern authentication.',
    image: budgetBuddyArt,
    github: 'https://github.com/Abdalla-Eldoumani/CalgaryHacks24',
    githubRepo: { owner: 'Abdalla-Eldoumani', repo: 'CalgaryHacks24' },
    tech: ['Next.js', 'TypeScript', 'PostgreSQL', 'Clerk Auth'],
    featured: false,
    insigniaId: 'ledger',
    category: 'web',
    metrics: 'CalgaryHacks 24 · live stock data',
  },
] satisfies readonly Project[];

// Helper functions for filtering projects.
export const getFeaturedProjects = () => projects.filter((p) => p.featured);

export const getProjectsByCategory = (category: Project['category']) =>
  projects.filter((p) => p.category === category);

export const getProjectByName = (name: string) =>
  projects.find((p) => p.name === name);
