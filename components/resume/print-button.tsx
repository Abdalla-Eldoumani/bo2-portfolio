'use client';

/*
  PRINT / SAVE PDF — the export rail's primary action. Printing IS the
  extract: the globals.css print block strips scene and chrome and the
  paper sheet becomes the page.
*/

export function PrintButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`confirm-punch bg-orange-fill font-display font-bold uppercase text-on-orange ${
        compact ? 'px-4 py-2 text-[15px]' : 'w-full px-4 py-2.5 text-[18px]'
      }`}
      style={{ boxShadow: '0 0 24px rgba(255,150,0,0.30)' }}
    >
      Print / Save PDF
    </button>
  );
}
