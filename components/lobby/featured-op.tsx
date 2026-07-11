import Link from 'next/link';
import { getProjectByName, projects } from '@/lib/data/projects';
import { education } from '@/lib/data/experience';
import { getGitHubStats } from '@/lib/api/github';

/*
  FEATURED OP rail (lobby, right column). Peregrine is the featured mission;
  the stats strip carries honest numerals: deployed op count (from data),
  stars earned (live GitHub with committed fallback), GPA (from education).
  Server component — data resolves at render, no client JS.
*/

export async function FeaturedOp() {
  const op = getProjectByName('Peregrine');
  const stats = await getGitHubStats();
  if (!op) return null;

  const deployed = projects.length;
  const gpa = education.gpa.split('/')[0];

  return (
    <Link
      href="/missions"
      aria-label={`Featured op: ${op.name} — open Mission Select`}
      className="panel confirm-punch block w-full max-w-[460px] lg:max-w-[392px]"
    >
      <div className="panel-header">
        <span>FEATURED OP</span>
        <span>01/{String(deployed).padStart(2, '0')}</span>
      </div>

      {/* Map preview: FALCON RIDGE, the Peregrine op art. */}
      <div className="relative mx-3.5 mt-3 h-[110px] overflow-hidden border border-white/10 lg:h-[138px]">
        <img
          src="/art/maps/peregrine.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span
          className="absolute bottom-0 left-0 px-2 py-0.5 font-mono text-[8.5px] tracking-[0.14em] text-ink-2"
          style={{ background: 'rgba(8,12,15,0.72)' }}
        >
          FALCON RIDGE
        </span>
      </div>

      <div className="px-3.5 pb-2.5 pt-3">
        <div className="font-display text-[22px] font-bold uppercase leading-none text-ink lg:text-[24px]">
          {op.name}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-[11px] text-ink-2">
          <span className="text-orange-core">C++ / CUDA / AVX2</span>
          <span>28× NUMPY THROUGHPUT</span>
          <span className="text-green">● STABLE</span>
        </div>
      </div>

      <div className="flex border-t border-white/10 font-mono text-[10.5px] text-ink-2">
        <div className="flex-1 border-r border-white/[0.08] px-3.5 py-2">
          DEPLOYED{' '}
          <span className="text-[13px] text-orange-core">{deployed}</span>
        </div>
        <div className="flex-1 border-r border-white/[0.08] px-3.5 py-2">
          STARS{' '}
          <span className="text-[13px] text-orange-core">{stats.stars}</span>
        </div>
        <div className="flex-1 px-3.5 py-2">
          GPA <span className="text-[13px] text-orange-core">{gpa}</span>
        </div>
      </div>
    </Link>
  );
}
