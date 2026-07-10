/*
  Scene backdrop — the lit environment every screen sits over. Fixed behind
  all content: gradient ground + the original SVG backdrop layers (hangar
  floodlights, silhouettes, bokeh) + grain, scanlines and vignette.

  Variants:
  - "hero"      dawn gradient, full layer stack (the lobby).
  - "interior"  darker gradient, lights + silhouettes dimmed (all screens).
  - "lost"      404 only: sepia ground, silhouettes only, heavy vignette.

  Pure server component, aria-hidden, zero JS. The SVG layers carry their own
  baked blur filters, so nothing here animates or repaints.
*/

type SceneVariant = 'hero' | 'interior' | 'lost';

const GROUND: Record<SceneVariant, string> = {
  hero: 'scene-hero',
  interior: 'scene-interior',
  lost: 'scene-lost',
};

export function Scene({ variant = 'interior' }: { variant?: SceneVariant }) {
  const lost = variant === 'lost';
  const hero = variant === 'hero';

  return (
    <div
      aria-hidden="true"
      data-print-hide
      className={`fixed inset-0 -z-10 overflow-hidden ${GROUND[variant]}`}
    >
      {!lost && (
        <>
          {/* Floodlights: warm key + cool wash. Dimmer inside. */}
          <img
            src="/art/backdrop/L2-floodlights.svg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: hero ? 1 : 0.55 }}
          />
          {/* Mid-ground silhouettes (equipment, figures), soft focus. */}
          <img
            src="/art/backdrop/L3-silhouettes.svg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: hero ? 1 : 0.7 }}
          />
          {/* Bokeh points in the lower third. */}
          <img
            src="/art/backdrop/L4-bokeh.svg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: hero ? 1 : 0.45 }}
          />
        </>
      )}
      {lost && (
        <img
          src="/art/backdrop/L3-silhouettes.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          style={{ filter: 'sepia(0.9) brightness(0.6)' }}
        />
      )}

      {/* Grain + scanlines + vignette, always on top of the layers. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/art/textures/grain.svg)',
          opacity: lost ? 0.5 : 0.22,
        }}
      />
      <div className="scanlines absolute inset-0" />
      <div
        className={`absolute inset-0 ${lost ? 'vignette-heavy' : 'vignette'}`}
      />
    </div>
  );
}
