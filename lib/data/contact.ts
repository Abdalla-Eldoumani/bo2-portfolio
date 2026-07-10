// Single source for the #comms section's invitation prose and the footer's
// colophon strings — substantive copy, so it lives in lib/data (the hard rule),
// never inline in a component. Identity (name/role/email/github/linkedin) stays
// in lib/site-config.ts; this module holds only the prose the after-action
// section and the footer render.
//
// - invitation: the recruiter conversion line (Inter body). The word "email" is
//   split into its own run so the after-action section can lift it to
//   --color-ink; concatenating the runs reproduces the sentence verbatim.
// - colophon.originalWork: the CONTACT-02 affirmation — names the ABSENCE of
//   game assets, quotes no wordmark.
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
      "Original interface — no Activision or Treyarch assets; all art built in-project.",
    builtWith: "Built with Next.js, React, and Tailwind CSS. Copyright 2026.",
  },
} satisfies Contact;
