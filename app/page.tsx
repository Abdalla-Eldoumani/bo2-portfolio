import { LobbyHero } from "@/components/lobby-hero";

// Section-composition root: one <main> that stacks the lobby sections in page
// order. The lobby calling card mounts first; later phases append sections
// (the service-record dossier is appended in this same phase's task 2). Replaces
// the Phase-1 foundation proof surface. Server Component — no client JS.

export default function Home() {
  return (
    <main>
      <LobbyHero />
    </main>
  );
}
