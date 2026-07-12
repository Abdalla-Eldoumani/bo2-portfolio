import { projects } from '@/lib/data/projects';
import { education } from '@/lib/data/experience';
import { getGitHubStats } from '@/lib/api/github';
import { FeaturedCarousel } from '@/components/lobby/featured-carousel';

/*
  FEATURED OP rail (lobby, right column). The carousel client leaf rotates
  through every op; this server wrapper resolves the honest stats strip
  (deployed op count, stars with committed fallback, GPA) at render.
*/

export async function FeaturedOp() {
  const stats = await getGitHubStats();
  const gpa = education.gpa.split('/')[0];

  return (
    <div className="w-full max-w-[460px] lg:max-w-[392px]">
      <FeaturedCarousel items={[...projects]}>
        <div className="flex border-t border-white/10 font-mono text-[10.5px] text-ink-2">
          <div className="flex-1 border-r border-white/[0.08] px-3.5 py-2">
            DEPLOYED{' '}
            <span className="text-[13px] text-orange-core">
              {projects.length}
            </span>
          </div>
          <div className="flex-1 border-r border-white/[0.08] px-3.5 py-2">
            STARS{' '}
            <span className="text-[13px] text-orange-core">{stats.stars}</span>
          </div>
          <div className="flex-1 px-3.5 py-2">
            GPA <span className="text-[13px] text-orange-core">{gpa}</span>
          </div>
        </div>
      </FeaturedCarousel>
    </div>
  );
}
