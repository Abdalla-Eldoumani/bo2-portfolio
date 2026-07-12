import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ScreenShell } from '@/components/chrome/screen-shell';
import { MissionSelect } from '@/components/missions/mission-select';
import { projects } from '@/lib/data/projects';

export const metadata: Metadata = {
  title: 'Mission Select',
  description:
    'Deployed projects — systems, performance, web and AI operations with live deployments and source.',
};

export default function MissionsPage() {
  return (
    <ScreenShell
      title="Mission Select"
      headerRight={
        <span className="font-mono text-[11px] tracking-[0.14em] text-teal">
          {projects.length} OPS ON ROTATION
        </span>
      }
    >
      {/* Suspense: MissionSelect reads ?op= via useSearchParams. */}
      <Suspense fallback={null}>
        <MissionSelect />
      </Suspense>
    </ScreenShell>
  );
}
