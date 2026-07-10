// Single source for the comms screen's invitation prose and the footer's
// colophon strings — substantive copy, so it lives in lib/data (the hard rule),
// never inline in a component. Identity (name/role/email/github/linkedin) stays
// in lib/site-config.ts; this module holds only the prose the comms screen
// and the footer render.
//
// - invitation: the recruiter conversion line (body face). The word "email" is
//   split into its own run so the comms screen can lift it to --color-ink;
//   concatenating the runs reproduces the sentence verbatim.
// - colophon.originalWork: the inspiration acknowledgment + originality
//   affirmation. The approved redesign contract (design package 00-README
//   "Legal line") sanctions exactly this one footer note naming the game and
//   studios in a non-affiliation disclaimer; no wordmark appears anywhere else.
// - colophon.builtWith: the subdued built-with line.

type ProseRun = { readonly text: string } | { readonly em: string };

type Contact = {
  readonly invitation: readonly ProseRun[];
  readonly colophon: {
    readonly originalWork: string;
    readonly builtWith: string;
  };
};

export const contact = {
  invitation: [
    {
      text:
        "Open to Summer 2026 internships and conversations about systems, performance, and the web. The fastest way to reach me is ",
    },
    { em: "email" },
    { text: " — I read and reply to every message." },
  ],
  colophon: {
    originalWork:
      "Inspired by the Black Ops 2 menu UI · Not affiliated with Activision or Treyarch. Every asset original, designed and built in-project.",
    builtWith: "Built with Next.js, React, and Tailwind CSS. Copyright 2026.",
  },
} satisfies Contact;
