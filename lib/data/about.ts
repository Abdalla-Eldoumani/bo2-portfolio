// The /about screen — why this portfolio exists, who the operator is, and
// what the site itself is built from. Substantive copy lives here (hard
// rule), never inline in components. The bio-adjacent lines are adapted from
// the author's own prior portfolio copy; facts match the July 2026 resume.

type ProseRun = { readonly text: string } | { readonly em: string };

export const whyIntel: readonly (readonly ProseRun[])[] = [
  [
    { text: 'I grew up inside the ' },
    { em: 'Black Ops 2' },
    {
      text:
        ' menus. The lobby hum, the countdown, the clack of a selection landing, one hot orange bar over cool steel — for a whole generation of players that interface is muscle memory. Years later I still think it is one of the best pieces of UI ever shipped in a game: dense, honest, instant, impossible to get lost in.',
    },
  ],
  [
    {
      text:
        'So when it came time to rebuild my portfolio, I rebuilt that feeling instead of another scrolling page. Every screen here is an original recreation of the language — a lit scene behind translucent panels, a filled orange row that means GO, keycap hints that never lie. No game assets, no ripped fonts, no screenshots: ',
    },
    { em: 'every pixel is drawn from scratch' },
    {
      text:
        ', which felt like the only honest way to salute a menu I love. If it hits you with nostalgia, it worked.',
    },
  ],
];

export const operatorBio: readonly (readonly ProseRun[])[] = [
  [
    {
      text:
        'Off the theme: I moved from Saudi Arabia to Calgary to understand how computers work, and I meant it literally — ',
    },
    { em: 'transistors up' },
    {
      text:
        '. The philosophy minor pulls the other direction: it taught me to ask why a design should exist before asking how to build it, which has killed more bad architectures than any code review.',
    },
  ],
  [
    {
      text:
        'When I am not at a keyboard I am bouldering, lifting, or lost in a reels spiral I will not defend.',
    },
  ],
];

/** Capability → proof, rendered as the FIELD QUALIFICATIONS table. */
export const qualifications = [
  { capability: 'ARMv8 assembly', proof: 'AEOS · Qala backend · CPSC 355' },
  { capability: 'Compilers', proof: 'Qala — lexer to VM to ARM64' },
  { capability: 'Concurrency', proof: 'Rust HTTP Server · AEOS scheduler' },
  { capability: 'SIMD and GPU compute', proof: 'Peregrine' },
  { capability: 'Product web', proof: 'DUST · Budget Buddy · this site' },
  {
    capability: 'Making hard things legible',
    proof: 'AArch64 Playground · CPSC 355 labs',
  },
] as const;

/** How the machine is built — the site's own spec sheet. */
export const siteSpec = [
  'Next.js App Router · React · Tailwind CSS — every screen statically rendered',
  'All art original SVG: scene layers, rank emblems, map previews, the portrait',
  'Fonts self-hosted (OFL) · no trackers · no analytics · console clean',
  'Keyboard-first: every hint in the bottom bar is a real handler',
] as const;
