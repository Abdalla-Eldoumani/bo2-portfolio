import type { CSSProperties } from "react";
import Image from "next/image";
import { Panel } from "@/components/ui/panel";
import { Insignia } from "@/components/ui/insignia";
import { HexGrid } from "@/components/ui/hex-grid";
import { MissionDetail } from "@/components/mission-detail";
import { cn } from "@/lib/utils/cn";
import { projects } from "@/lib/data/projects";

// Mission-select (#missions) — the projects armory. Server Component (no
// "use client"): it is the FIRST rendering consumer of the Phase-2 static image
// imports, so `next build` now fails loudly if any of the 8 files is missing
// (DATA-03). It mirrors the create-a-class/service-record shell (bg-steel
// px-5 py-12 sm:px-8 sm:py-16 lg:py-24, 1200px measure) and, like the siblings,
// does NOT use `.panel-reveal` (its scripting-gated hidden state would vanish
// for JS-enabled visitors on a Server-only surface).
//
// The 5 featured projects render as full-width campaign rows (image-left /
// content-right at >=768px, active line-strong edge), the 3 non-featured as
// compact grid cards — the featured/compact distinction is SPATIAL (width +
// name size + column context), never a color swap, so it survives forced-colors.
//
// Accent budget: the ONE grid orange is the "PRIMARY MISSION" marker on
// projects[0]. Deploy links are steel/ink chips (8 accent CTAs would be a
// disallowed ladder of orange); `live === '#'` and `github === '#'` render
// designed disabled chips (NO DEPLOYMENT / SOURCE CLASSIFIED), never dead links.
//
// The "MISSION BRIEFING" disclosure is a native <details> whose body server-
// renders fullDescription + the full attachment list, so the briefing is
// reachable with JavaScript disabled (SYS-03). The single client MissionDetail
// leaf (mounted once at the end) enhances those triggers into the focus-trapped
// Modal; it receives plain serializable briefing fields only — no StaticImageData.

// Steel chip footprint shared by the deploy links and the briefing trigger — a
// small chamfer, line-strong edge, panel fill (actionable-but-not-accent).
const STEEL_CHIP: CSSProperties = {
  "--_c": "var(--chamfer-sm)",
  "--_edge": "var(--color-line-strong)",
  "--_fill": "var(--color-panel)",
} as CSSProperties;

// Disabled chip footprint (NO DEPLOYMENT / SOURCE CLASSIFIED) — same silhouette
// as a deploy chip but a fainter edge, so the row stays balanced.
const DISABLED_CHIP: CSSProperties = {
  "--_c": "var(--chamfer-sm)",
  "--_edge": "var(--color-line-faint)",
  "--_fill": "var(--color-panel)",
} as CSSProperties;

// The section's one orange: the PRIMARY MISSION marker chip (accent edge),
// echoing the dossier clearance-tag chip.
const ACCENT_CHIP: CSSProperties = {
  "--_c": "var(--chamfer-sm)",
  "--_edge": "var(--color-accent)",
  "--_fill": "var(--color-panel)",
} as CSSProperties;

// Original padlock glyph (currentColor so it remaps under forced-colors);
// decorative — the visible "NO DEPLOYMENT" / "SOURCE CLASSIFIED" text carries
// the disabled meaning (never color-only).
function LockGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

// Real deploy anchor: a steel chip, >=44px coarse target, press feedback, and
// (external URLs only) target=_blank + rel=noopener noreferrer against reverse
// tabnabbing (T-06-03). Never orange in the grid region.
function DeployChip({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="chamfer press-flash tap-target inline-flex items-center px-4 py-2"
      style={STEEL_CHIP}
    >
      <span className="relative z-[1] font-display text-button uppercase tracking-[0.04em] text-ink">
        {label}
      </span>
    </a>
  );
}

// Designed disabled state for a '#' sentinel link (T-06-04): a non-anchor
// <span> — never a dead/hidden <a> — carrying the visible label + a padlock
// glyph + aria-disabled, so no click resolves to a bogus destination.
function DisabledChip({ label }: Readonly<{ label: string }>) {
  return (
    <span
      aria-disabled="true"
      className="chamfer inline-flex items-center px-4 py-2"
      style={DISABLED_CHIP}
    >
      <span className="relative z-[1] inline-flex items-center gap-2 font-label text-stat-label uppercase tracking-[0.08em] text-ink-muted">
        <LockGlyph />
        {label}
      </span>
    </span>
  );
}

// Non-interactive attachment chip. The Phase-5 SkillChip register is
// deliberately re-expressed here (a 3px steel left tick, verbatim name,
// uppercased in CSS) rather than importing it, to avoid editing the verified
// create-a-class surface. Names render verbatim (C++, Next.js, AVX2 SIMD,
// Strassen's Algorithm keep exact characters).
function AttachmentChip({ name }: Readonly<{ name: string }>) {
  return (
    <span className="chamfer inline-flex" style={{ "--_c": "var(--chamfer-sm)" } as CSSProperties}>
      <span className="relative z-[1] flex items-center border-l-[3px] border-ink-muted px-4 py-2 font-display text-body uppercase tracking-[0.04em] text-ink">
        {name}
      </span>
    </span>
  );
}

// The card image. Branch on the file type (project.image.src.endsWith('.svg')):
// the 5 .png projects render via next/image (blur placeholder auto-derived from
// the static import — NEVER pass placeholder="blur" to an svg, it throws at
// build); the 3 .svg placeholder-art projects render the tactical placeholder
// tile (panel ground + HexGrid texture + large insignia + NO VISUAL FEED). Both
// share the fixed 16/9 aspect box so the grid never reflows (MISSION-04).
function MissionImage({
  image,
  name,
  insigniaId,
  sizes,
}: Readonly<{
  image: (typeof projects)[number]["image"];
  name: string;
  insigniaId: string;
  sizes: string;
}>) {
  if (image.src.endsWith(".svg")) {
    return (
      <div className="relative aspect-[16/9] overflow-hidden bg-panel">
        <HexGrid className="text-line-faint" />
        <div className="relative z-[1] flex h-full flex-col items-center justify-center gap-2">
          <Insignia id={insigniaId} className="h-12 w-12 text-ink-muted" />
          <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-muted">
            No Visual Feed
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/9] overflow-hidden">
      <Image
        src={image}
        alt={`${name} interface`}
        fill
        sizes={sizes}
        placeholder="blur"
        className="object-cover"
      />
    </div>
  );
}

type Project = (typeof projects)[number];

function DeployLinks({ project }: Readonly<{ project: Project }>) {
  const hasLive = project.live !== undefined && project.live !== "#";
  const hasSource = project.github !== undefined && project.github !== "#";
  return (
    <div className="flex flex-wrap gap-2">
      {hasLive ? (
        <DeployChip href={project.live as string} label="Deploy" />
      ) : (
        <DisabledChip label="No Deployment" />
      )}
      {hasSource ? (
        <DeployChip href={project.github as string} label="Source" />
      ) : (
        <DisabledChip label="Source Classified" />
      )}
    </div>
  );
}

// The card body shared by both variants. `variant` drives only spatial cues
// (name size); the parts are otherwise identical. `index` is the GLOBAL
// projects index so the briefing trigger aligns with the serialized leaf props.
function MissionContent({
  project,
  index,
  variant,
}: Readonly<{ project: Project; index: number; variant: "featured" | "compact" }>) {
  return (
    <div className="flex flex-col gap-4">
      {index === 0 ? (
        <span className="chamfer inline-block self-start px-2 py-1" style={ACCENT_CHIP}>
          <span className="relative z-[1] font-label text-stat-label uppercase tracking-[0.08em] text-accent">
            Primary Mission
          </span>
        </span>
      ) : null}

      <div className="flex items-center gap-2">
        <Insignia
          id={project.insigniaId}
          className="h-6 w-6 shrink-0 text-ink-secondary"
        />
        <h3
          className={cn(
            "font-display uppercase tracking-[0.04em] text-ink",
            variant === "featured" ? "text-h3" : "text-lead",
          )}
        >
          {project.name}
        </h3>
      </div>

      <p className="max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary">
        {project.description}
      </p>

      <div>
        <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
          Attachments
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {project.tech.map((name) => (
            <AttachmentChip key={name} name={name} />
          ))}
        </div>
      </div>

      {project.metrics ? (
        <div>
          <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
            Combat Record
          </p>
          <p className="mt-1 font-mono text-button leading-[1.4] tabular-nums text-ink">
            {project.metrics}
          </p>
        </div>
      ) : null}

      <DeployLinks project={project} />

      {/* Server briefing base (SYS-03): fullDescription + the FULL attachment
          list inline-expand with no JS. The MissionDetail leaf intercepts the
          summary post-hydration (data-briefing-trigger carries the index) and
          opens the modal instead; data-briefing-details lets it close/keep the
          base collapsed so content never double-renders. */}
      <details
        data-briefing-details
        className="border-t border-line-faint pt-4"
      >
        <summary
          data-briefing-trigger={index}
          className="chamfer press-flash tap-target inline-flex cursor-pointer list-none items-center px-4 py-2 [&::-webkit-details-marker]:hidden"
          style={STEEL_CHIP}
        >
          <span className="relative z-[1] font-display text-button uppercase tracking-[0.04em] text-ink">
            Mission Briefing
          </span>
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <p className="max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary">
            {project.fullDescription ?? project.description}
          </p>
          <div>
            <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Attachments
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.tech.map((name) => (
                <AttachmentChip key={name} name={name} />
              ))}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

// Featured campaign row: full width, image-left / content-right at >=768px,
// active line-strong edge (a structural featuring cue, never color-only).
function FeaturedCard({ project, index }: Readonly<{ project: Project; index: number }>) {
  return (
    <Panel active>
      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-start">
        <MissionImage
          image={project.image}
          name={project.name}
          insigniaId={project.insigniaId}
          sizes="(min-width: 1024px) 480px, (min-width: 768px) 40vw, 100vw"
        />
        <MissionContent project={project} index={index} variant="featured" />
      </div>
    </Panel>
  );
}

// Compact grid card: image-top / content-below, tighter name (text-lead),
// default (line-faint) edge — the compact tier by size + column context.
function CompactCard({ project, index }: Readonly<{ project: Project; index: number }>) {
  return (
    <Panel>
      <div className="flex flex-col gap-4 p-5">
        <MissionImage
          image={project.image}
          name={project.name}
          insigniaId={project.insigniaId}
          sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 100vw"
        />
        <MissionContent project={project} index={index} variant="compact" />
      </div>
    </Panel>
  );
}

// Global-index entries so the briefing trigger index aligns with the leaf props;
// the data is already grouped (0..4 featured, 5..7 compact).
const entries = projects.map((project, index) => ({ project, index }));
const featured = entries.filter((entry) => entry.project.featured);
const compact = entries.filter((entry) => !entry.project.featured);

// Plain serializable briefing fields for the client leaf — no StaticImageData
// (the modal is text-only briefing; T-06-05: only public fields cross).
const briefings = projects.map((project) => ({
  name: project.name,
  fullDescription: project.fullDescription ?? project.description,
  tech: project.tech,
  metrics: project.metrics ?? null,
  live: project.live ?? null,
  github: project.github ?? null,
  insigniaId: project.insigniaId,
}));

export function MissionSelect() {
  return (
    <section
      id="missions"
      aria-labelledby="missions-heading"
      className="bg-steel px-5 py-12 sm:px-8 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Header strip: real <h2> + subtitle, no accent (the section's one
            orange is the lead-card PRIMARY MISSION marker). */}
        <Panel>
          <div className="flex flex-col gap-2 p-5">
            <h2
              id="missions-heading"
              tabIndex={-1}
              className="font-display text-h2 uppercase tracking-[0.04em] text-ink"
            >
              Mission Select
            </h2>
            <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Deployed Projects and Ops
            </p>
          </div>
        </Panel>

        {/* Featured campaign rows first (source order), gap-6 between them. */}
        <div className="mt-8 flex flex-col gap-6">
          {featured.map((entry) => (
            <FeaturedCard
              key={entry.project.name}
              project={entry.project}
              index={entry.index}
            />
          ))}
        </div>

        {/* 32px separation, then the 3 compact cards: 1 / 2 / 3 columns. */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {compact.map((entry) => (
            <CompactCard
              key={entry.project.name}
              project={entry.project}
              index={entry.index}
            />
          ))}
        </div>
      </div>

      {/* One client leaf for the whole section: enhances the <details> triggers
          into the single focus-trapped Modal (mounting a client leaf from a
          Server section adds no `use client` here). */}
      <MissionDetail projects={briefings} />
    </section>
  );
}
