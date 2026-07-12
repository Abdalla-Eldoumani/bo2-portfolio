'use client';

import { useEffect, useState } from 'react';

/*
  FIELD STATUS rail: status, station coordinates, live local clock, signal
  bars. The clock mounts empty and ticks after hydration (no mismatch).
*/

export function FieldStatus() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Edmonton',
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'STATUS',
      value: (
        <span className="flex items-center gap-2 text-green">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-green" />
          OPEN TO WORK
        </span>
      ),
    },
    { label: 'STATION', value: 'CALGARY, AB · 51.04°N −114.07°W' },
    { label: 'LOCAL TIME', value: time ? `${time} MST` : '—:—:— MST' },
    {
      label: 'SIGNAL',
      value: (
        <span aria-label="Signal strength: full" className="flex items-end gap-[3px]">
          {[4, 7, 10, 13].map((h) => (
            <span
              key={h}
              aria-hidden="true"
              className="w-[5px] bg-orange-fill"
              style={{ height: h }}
            />
          ))}
        </span>
      ),
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <span>FIELD STATUS</span>
      </div>
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-3 last:border-b-0"
          >
            <dt className="font-label text-[11px] font-semibold tracking-[0.12em] text-ink-3">
              {row.label}
            </dt>
            <dd className="font-mono text-[12px] text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
