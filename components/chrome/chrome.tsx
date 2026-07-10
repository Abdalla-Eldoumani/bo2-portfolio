'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { TopBar } from '@/components/chrome/top-bar';
import { HintBar } from '@/components/chrome/hint-bar';
import { NavOverlay } from '@/components/chrome/nav-overlay';
import { BootIn } from '@/components/chrome/boot-in';

/*
  Chrome — the persistent machine around every screen: top status bar +
  playercard chip, bottom hint bar, the mobile nav overlay, the boot-in
  sequence, and the global keyboard handlers the hint bar advertises.

  Global keys (honest hints contract):
  - ESC     back to lobby (no-op on the lobby; closes the overlay first)
  - CTRL+P  route to /resume, then print (native print when already there)
  Screen-local keys (menu arrows, C copy, R resync) live in their screens.
*/

export function Chrome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (typing) return;

      if (e.key === 'Escape') {
        // <dialog> closes itself; only handle screen-level back here.
        if (!menuOpen && pathname !== '/') router.push('/');
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        if (pathname === '/resume') return; // native print
        e.preventDefault();
        router.push('/resume');
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, pathname, router]);

  return (
    <>
      <TopBar />
      <HintBar onMenu={openMenu} />
      <NavOverlay open={menuOpen} onClose={closeMenu} />
      <BootIn />
    </>
  );
}
