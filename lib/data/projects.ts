import type { Project } from '@/lib/types/project';

// Map-preview art: original in-house SVG scenes (public/art/maps), imported
// statically so a missing file fails `next build` instead of 404-ing.
import peregrineArt from '@/public/art/maps/peregrine.svg';
import aeosArt from '@/public/art/maps/aeos.svg';
import latticeArt from '@/public/art/maps/lattice.svg';
import playgroundArt from '@/public/art/maps/aarch64-playground.svg';
import qalaArt from '@/public/art/maps/qala.svg';
import regexFsmArt from '@/public/art/maps/regex-fsm.svg';
import whittleArt from '@/public/art/maps/whittle.svg';
import rustServerArt from '@/public/art/maps/rust-http-server.svg';
import credenceArt from '@/public/art/maps/credence.svg';
import dossierArt from '@/public/art/maps/dossier.svg';
import qalamArt from '@/public/art/maps/qalam.svg';
import dustArt from '@/public/art/maps/dust.svg';
import budgetBuddyArt from '@/public/art/maps/budget-buddy.svg';
import cloudPrepArt from '@/public/art/maps/cloud-practitioner-prep.svg';
import deadzoneArt from '@/public/art/maps/deadzone.svg';
import qemuMcpArt from '@/public/art/maps/qemu-mcp-server.svg';
import bindiffArt from '@/public/art/maps/bindiff-mcp.svg';

/**
 * The mission set — fourteen showcased operations, strongest first. Every
 * factual claim traces to the July 2026 resume or the project's own README
 * (benchmark figures come from each project's harness); deployments were
 * verified against the author's portfolio data of the same date. Retired from
 * rotation: FastMathExt (superseded by Peregrine), the self-checkout team
 * project, and early hackathon-era sites.
 */
export const projects = [
  {
    name: 'Peregrine',
    slug: 'peregrine',
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
    slug: 'aeos',
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
    name: 'Lattice',
    slug: 'lattice',
    description:
      'A finite-domain constraint solver and a CDCL SAT solver, both written from scratch in Haskell, with a web front end that streams the search live so you can watch them think.',
    fullDescription:
      'Value-elimination propagators run to fixpoint over backtracking search with minimum-remaining-values ordering; the SAT side does watched-literal propagation, 1UIP clause learning, VSIDS and Luby restarts. One hot loop generic over the monad runs fast in ST or streams every decision over WebSocket in IO. Correctness is differential: CP, SAT and a brute-force oracle checked against each other.',
    image: latticeArt,
    tech: ['Haskell', 'Scotty', 'WebSockets', 'Next.js', 'QuickCheck'],
    featured: true,
    insigniaId: 'lattice',
    category: 'systems',
    metrics: 'CP + CDCL SAT from scratch · 4 animated puzzle types',
  },
  {
    name: 'AArch64 Playground',
    slug: 'aarch64-playground',
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
    slug: 'qala',
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
    name: 'Deadzone',
    slug: 'deadzone',
    description:
      'A Vampire Survivors-style horde game written in ARMv8 AArch64 assembly and rendered entirely in the terminal with ANSI escape codes: the weapons fire themselves, you do the dodging.',
    fullDescription:
      'Survive waves of zombies, collect XP and level up; SPACE spends a screen-clearing bomb and F freezes the horde. Particles, screen shake and boss fights, all hand-rolled in assembly — player, enemies, effects and boss logic each live in their own module.',
    image: deadzoneArt,
    tech: ['AArch64 Assembly', 'ANSI Terminal', 'QEMU', 'm4', 'Make'],
    featured: true,
    insigniaId: 'horde',
    category: 'systems',
    metrics: 'Horde survival in pure ARM64 asm · terminal-rendered',
  },
  {
    name: 'Regex FSM',
    slug: 'regex-fsm',
    description:
      'A regex and finite-automata visualizer that runs the constructive procedures of formal language theory step by step — Thompson, subset construction, minimization, Brzozowski derivatives — with challenges graded by language equivalence.',
    fullDescription:
      'Built with a collaborator for CPSC 351 at the University of Calgary. A pure, fully unit-tested algorithm layer under a Cytoscape-rendered UI: 1181 unit, integration and property tests plus over 150 end-to-end and accessibility tests, property-checked against a brute-force language oracle.',
    image: regexFsmArt,
    live: 'https://regex-fsm.vercel.app',
    tech: ['TypeScript', 'React 19', 'Vite', 'Cytoscape', 'fast-check'],
    featured: true,
    insigniaId: 'automaton',
    category: 'education',
    metrics: '1181 tests · 150+ E2E · language-equivalence grading',
  },
  {
    name: 'Whittle',
    slug: 'whittle',
    description:
      'Bottom-up enumerative program synthesis, live: give it a type signature and input/output examples and watch it consider millions of candidate programs and keep a few dozen.',
    fullDescription:
      'A typed DSL over integers, booleans and lists with five higher-order components; a fuel-bounded evaluator abandons runaway candidates and observational-equivalence pruning collapses programs with identical behavior. The search streams over server-sent events into a React visualizer; a 17-task gallery is tested in CI.',
    image: whittleArt,
    tech: ['Haskell', 'React', 'TypeScript', 'SSE', 'QuickCheck'],
    featured: false,
    insigniaId: 'chisel',
    category: 'ai',
    metrics: 'Millions considered, dozens kept · 17-task gallery',
  },
  {
    name: 'Rust HTTP Server',
    slug: 'rust-http-server',
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
    name: 'QEMU MCP Server',
    slug: 'qemu-mcp-server',
    description:
      'An MCP server that gives AI agents direct control over QEMU virtual machines: create, boot, snapshot, inspect and destroy VMs through standard tool calls, speaking QMP over Unix sockets.',
    fullDescription:
      'Published to npm with stdio and HTTP transports and setup docs for Claude Desktop, Cursor and Claude Code. Seventeen tools cover VM lifecycle, execution control, qcow2 snapshots, console I/O and memory dumps across aarch64 and x86_64 guests.',
    image: qemuMcpArt,
    tech: ['TypeScript', 'MCP', 'QEMU', 'QMP', 'npm'],
    featured: false,
    insigniaId: 'hypervisor',
    category: 'ai',
    metrics: '17 MCP tools · npm-published · aarch64 + x86_64',
  },
  {
    name: 'Credence',
    slug: 'credence',
    description:
      'A small probabilistic programming language embedded in Haskell: models are draw-and-observe programs, and the same model runs under importance sampling, Metropolis-Hastings or a particle filter while a visualizer animates the inference live.',
    fullDescription:
      'Each inference backend is an interpreter of the model monad. The engine works in log-space with a seedable RNG and streams samples and running summaries to the front end; posteriors are checked against closed-form Beta-Bernoulli and Normal-Normal answers under fixed seeds.',
    image: credenceArt,
    tech: ['Haskell', 'Probabilistic PL', 'SMC', 'MCMC'],
    featured: false,
    insigniaId: 'dice',
    category: 'ai',
    metrics: '3 inference backends · checked against exact posteriors',
  },
  {
    name: 'Dossier',
    slug: 'dossier',
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
    name: 'Qalam',
    slug: 'qalam',
    description:
      'A paint program written entirely in AArch64 assembly — no C, no libc, no operating system. It boots as its own bare-metal kernel on QEMU, drives a 1024×768 display through ramfb and reads the mouse over VirtIO, polling everything by hand.',
    fullDescription:
      'Ten drawing tools, a 32-color palette, single-step undo and BMP export, in a few thousand lines of readable assembly with no MMU and no interrupts. Every tool has a golden-image test: a Python harness drives synthetic input over QMP and asserts the framebuffer pixel by pixel.',
    image: qalamArt,
    tech: ['AArch64 Assembly', 'QEMU', 'VirtIO', 'ramfb', 'm4'],
    featured: false,
    insigniaId: 'easel',
    category: 'systems',
    metrics: 'Zero C · 1024×768 ramfb · golden-image tested',
  },
  {
    name: 'BinDiff MCP',
    slug: 'bindiff-mcp',
    description:
      'An MCP server for AI-powered binary analysis: it wraps GNU binutils so an agent can read ELF sections and symbols, disassemble functions, and semantically compare two builds of the same binary.',
    fullDescription:
      'Ten tools — six for analysis and four for comparison — with C++ demangling, size breakdowns, symbol and section diffs, and cross-toolchain support through a configurable prefix. Pairs naturally with the assembly projects: analyze and diff the binaries they produce.',
    image: bindiffArt,
    tech: ['TypeScript', 'MCP', 'GNU Binutils', 'ELF'],
    featured: false,
    insigniaId: 'lens',
    category: 'ai',
    metrics: '10 tools · symbol + section diffs · cross-toolchain',
  },
  {
    name: 'DUST',
    slug: 'dust',
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
    slug: 'budget-buddy',
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
  {
    name: 'Cloud Practitioner Prep',
    slug: 'cloud-practitioner-prep',
    description:
      'A free, open-source study site for the AWS Cloud Practitioner exam: 22 lessons, 886 original practice questions drilled by domain, timed 65-question mock exams and a readiness dashboard — fully static, no accounts, progress stays in the browser.',
    fullDescription:
      'Astro with React islands for the quiz engine; adaptive drill weights toward weakest domains, spaced-repetition review, an offline-capable PWA and JSON progress export. Every question is original and every AWS fact links to its documentation.',
    image: cloudPrepArt,
    live: 'https://cloud-practitioner-prep.vercel.app',
    tech: ['Astro', 'React', 'TypeScript', 'Tailwind v4', 'MDX'],
    featured: false,
    insigniaId: 'cloud',
    category: 'education',
    metrics: '886 original questions · 22 lessons · CLF-C02',
  },
] satisfies readonly Project[];

// Helper functions for filtering projects.
export const getFeaturedProjects = () => projects.filter((p) => p.featured);

export const getProjectByName = (name: string) =>
  projects.find((p) => p.name === name);
