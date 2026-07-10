import { Scene } from '@/components/chrome/scene';

/*
  Interior screen shell: darker scene variant + the shared header anatomy
  (breadcrumb ▸ screen title ▸ hairline rule) + content column. Padding
  clears the fixed top chrome and bottom hint bar. Server component.

  `headerRight` renders flush-right of the title row (allocation pips, ops
  counters, sync stamps). `accent` tints the title's breadcrumb tick.
*/

export function ScreenShell({
  title,
  breadcrumb = 'LOBBY',
  headerRight,
  children,
  lost = false,
}: {
  title: string;
  breadcrumb?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  lost?: boolean;
}) {
  return (
    <>
      <Scene variant={lost ? 'lost' : 'interior'} />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-dvh w-full max-w-[1368px] flex-col px-4 pb-24 pt-16 sm:px-6 lg:px-9 lg:pt-[72px]"
      >
        <header className="rise mb-5 lg:mb-7" style={{ '--i': 0 } as React.CSSProperties}>
          <div className="mb-1.5 flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] text-ink-3">
            <span aria-hidden="true" className="h-[2px] w-5 bg-orange-fill" />
            <span>
              {breadcrumb} <span aria-hidden="true">▸</span>{' '}
              <span className="text-orange-core">{title.toUpperCase()}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h1 className="font-display text-[34px] font-bold uppercase leading-none tracking-[-0.01em] text-ink lg:text-[56px]">
              {title}
            </h1>
            {headerRight}
          </div>
          <div className="mt-3 h-px w-full bg-white/10" />
        </header>
        {children}
      </main>
    </>
  );
}
