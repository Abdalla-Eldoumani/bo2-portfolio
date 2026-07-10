import { LobbyHero } from "@/components/lobby-hero";
import { ServiceRecord } from "@/components/service-record";

// Section-composition root: one <main> that stacks the lobby sections in page
// order — the lobby calling card, then the service-record dossier. Later phases
// append sections after these two. Replaces the Phase-1 foundation proof
// surface. Server Component — no client JS.

export default function Home() {
  return (
    <main>
      <LobbyHero />
      <ServiceRecord />
    </main>
  );
}
