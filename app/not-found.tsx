import Link from 'next/link';
import { Scene } from '@/components/chrome/scene';
import { LostCoordinates } from '@/components/lost/lost-coordinates';
import { siteConfig } from '@/lib/site-config';

/*
  404 — TRANSMISSION LOST. The one sepia screen on the site (the Zombies
  register): grimy scene, heavy grain, chromatic-split title with a bounded
  opacity flicker (≤120ms pulses inside a 5.2s cycle, opacity-only, never a
  full-frame flash, stripped under reduced motion). Orange is reserved for
  the one action — RECONNECT TO LOBBY; red is the SIGNAL LOST dot + eyebrow
  only. No `metadata` export: Next forbids it on a global not-found.
*/

export default function NotFound() {
  return (
    <>
      <Scene variant="lost" />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-dvh w-full max-w-[820px] flex-col items-center justify-center px-5 pb-24 pt-16 text-center"
      >
        <p className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.24em] text-red">
          <span
            aria-hidden="true"
            className="blink-beacon h-2 w-2 rounded-full bg-red"
            style={{ boxShadow: '0 0 8px rgba(176,58,48,0.8)' }}
          />
          SIGNAL LOST
        </p>

        <h1
          className="flicker mt-5 font-display text-[42px] font-bold uppercase leading-none sm:text-[64px]"
          style={{
            color: '#e8ddc4',
            textShadow:
              '3px 0 0 rgba(176,58,48,0.35), -3px 0 0 rgba(89,168,194,0.3), 0 2px 24px rgba(5,4,2,0.9)',
          }}
        >
          Transmission Lost
        </h1>

        <div
          className="mt-2 font-display text-[88px] font-bold leading-none sm:text-[120px]"
          style={{ color: 'rgba(232,221,196,0.16)' }}
          aria-hidden="true"
        >
          404
        </div>

        <p
          className="mt-2 font-label text-[15px] font-semibold tracking-[0.14em]"
          style={{ color: '#c9bfa8' }}
        >
          THIS SECTOR WAS OVERRUN
        </p>

        <LostCoordinates />

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="confirm-punch bg-orange-fill px-6 py-2 font-display text-[19px] font-bold uppercase text-on-orange"
            style={{ boxShadow: '0 0 24px rgba(255,150,0,0.3)' }}
          >
            Reconnect to Lobby ▸
          </Link>
          <a
            href={`mailto:${siteConfig.email}?subject=Missing%20intel%20report`}
            className="border px-5 py-2 font-display text-[16px] font-bold uppercase"
            style={{ borderColor: 'rgba(232,221,196,0.3)', color: '#c9bfa8' }}
          >
            Report Missing Intel
          </a>
        </div>
      </main>
    </>
  );
}
