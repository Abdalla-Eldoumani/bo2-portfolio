import { AfterAction } from "@/components/after-action";
import { CombatRecord } from "@/components/combat-record";
import { CreateAClass } from "@/components/create-a-class";
import { Footer } from "@/components/footer";
import { LobbyHero } from "@/components/lobby-hero";
import { MenuRail } from "@/components/menu-rail";
import { MissionSelect } from "@/components/mission-select";
import { Scoreboard } from "@/components/scoreboard";
import { ServiceRecord } from "@/components/service-record";

// Section-composition root: one <main> that stacks the lobby sections in page
// order — the lobby calling card, then the service-record dossier. Later phases
// append sections after these two. It also mounts the MenuRail island and owns
// the composition-root liveIds list (the sections currently rendered) — later
// phases append their id here with ZERO change to the rail component.
//
// The fixed 280px rail is offset via lg:pl-[280px] padding on <main> (padding,
// not a grid track — avoids the exact-1024px horizontal scrollbar, RESEARCH
// Pitfall 5); the inner section content keeps its own 1200px measure. Below
// 1024px the rail is a sticky top bar in normal flow, so no offset applies.

export default function Home() {
  return (
    <>
      <MenuRail
        liveIds={[
          "lobby",
          "dossier",
          "loadout",
          "missions",
          "record",
          "scoreboard",
          "comms",
        ]}
      />
      <main id="main-content" tabIndex={-1} className="lg:pl-[280px]">
        <LobbyHero />
        <ServiceRecord />
        <CreateAClass />
        <MissionSelect />
        <CombatRecord />
        <Scoreboard />
        <AfterAction />
      </main>
      <Footer />
    </>
  );
}
