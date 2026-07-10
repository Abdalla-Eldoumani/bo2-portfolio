import { Scene } from '@/components/chrome/scene';
import { LobbyMenu } from '@/components/lobby/lobby-menu';
import { FeaturedOp } from '@/components/lobby/featured-op';
import { Ticker } from '@/components/lobby/ticker';
import { siteConfig } from '@/lib/site-config';

/*
  The lobby — screen 01. Hangar-dawn scene, personnel-file identity block,
  the numbered main menu, and the FEATURED OP rail. Ticker + hint bar pin to
  the bottom chrome. The identity block and menu stagger in with .rise.
*/

const [firstName, ...rest] = siteConfig.name.split(' ');
const lastName = rest.join(' ');

export default function Home() {
  return (
    <>
      <Scene variant="hero" />
      <Ticker />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-dvh w-full max-w-[1368px] flex-col px-4 pb-[120px] pt-16 sm:px-6 lg:px-9 lg:pt-[84px]"
      >
        {/* Identity */}
        <div className="rise" style={{ '--i': 0 } as React.CSSProperties}>
          <div className="mb-2.5 flex items-center gap-3.5 lg:mb-3">
            <span aria-hidden="true" className="h-[3px] w-7 bg-orange-fill lg:w-11" />
            <span className="font-mono text-[10px] tracking-[0.16em] text-orange-core lg:text-[13px] lg:tracking-[0.22em]">
              CLASSIFIED // PERSONNEL FILE
            </span>
          </div>
          <h1
            className="font-display font-bold uppercase text-ink"
            style={{
              fontSize: 'clamp(52px, 8.2vw, 112px)',
              lineHeight: 0.9,
              letterSpacing: '-0.014em',
              textShadow: '0 2px 28px rgba(5,8,10,0.85)',
            }}
          >
            {firstName}
            <br />
            {lastName}
          </h1>

          {/* Plate bar */}
          <div className="mt-4 inline-flex flex-col border border-white/[0.22] bg-[rgba(8,12,15,0.45)] sm:flex-row sm:items-stretch lg:mt-[18px]">
            <span className="bg-orange-fill px-3.5 py-1 font-display text-[16px] font-bold uppercase text-on-orange lg:px-4 lg:text-[19px]">
              {siteConfig.jobTitle}
            </span>
            <span className="flex items-center gap-2.5 px-3.5 py-1 lg:px-4">
              <span className="font-label text-[13px] font-semibold tracking-[0.06em] text-ink-menu lg:text-[16px]">
                CALGARY AB
              </span>
              <span className="flex items-center gap-1.5 border-l border-white/[0.18] pl-2.5 font-mono text-[9.5px] text-green lg:pl-3.5 lg:text-[11px]">
                <span
                  aria-hidden="true"
                  className="h-[7px] w-[7px] rounded-full bg-green"
                />
                OPEN TO WORK
              </span>
            </span>
          </div>
        </div>

        {/* Menu + rail */}
        <div className="mt-8 flex flex-1 flex-col gap-6 lg:mt-12 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <LobbyMenu />
          <div
            className="rise w-full lg:w-[392px] lg:shrink-0"
            style={{ '--i': 4 } as React.CSSProperties}
          >
            <FeaturedOp />
          </div>
        </div>
      </main>
    </>
  );
}
