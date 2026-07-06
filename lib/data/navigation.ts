import type { NavItem } from '@/lib/types/navigation';

/**
 * Section manifest the Phase 4 navigation rail consumes: one entry per lobby
 * section in page order, each deep-linking to its anchor on the single page.
 * Labels/subtitles are original BO2 main-menu voice (there is no source data
 * file for these); labels stay title-case here and the rail uppercases them.
 */
export const navigation = [
  {
    id: 'lobby',
    label: 'Lobby',
    subtitle: 'Deploy screen and callsign',
    href: '#lobby',
  },
  {
    id: 'dossier',
    label: 'Service Record',
    subtitle: 'Classified operator dossier',
    href: '#dossier',
  },
  {
    id: 'loadout',
    label: 'Create a Class',
    subtitle: 'Skill loadout and wildcards',
    href: '#loadout',
  },
  {
    id: 'missions',
    label: 'Mission Select',
    subtitle: 'Deployed projects and ops',
    href: '#missions',
  },
  {
    id: 'record',
    label: 'Combat Record',
    subtitle: 'Career rank progression',
    href: '#record',
  },
  {
    id: 'scoreboard',
    label: 'Scoreboard',
    subtitle: 'Live GitHub telemetry',
    href: '#scoreboard',
  },
  {
    id: 'comms',
    label: 'Comms',
    subtitle: 'Open a channel',
    href: '#comms',
  },
] satisfies readonly NavItem[];
