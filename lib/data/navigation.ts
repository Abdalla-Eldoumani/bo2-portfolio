import type { NavItem } from '@/lib/types/navigation';

/**
 * Screen manifest — one entry per destination in lobby-menu order. The site is
 * screen-based (BO2 menus navigate between full-viewport screens), so every
 * href is a real route, not an anchor. Labels are original BO2 main-menu
 * voice; components uppercase them for display.
 */
export const navigation = [
  {
    id: 'dossier',
    label: 'Service Record',
    subtitle: 'Operator dossier',
    href: '/dossier',
  },
  {
    id: 'loadout',
    label: 'Create a Class',
    subtitle: 'Skill loadout and wildcards',
    href: '/loadout',
  },
  {
    id: 'missions',
    label: 'Mission Select',
    subtitle: 'Deployed projects and ops',
    href: '/missions',
  },
  {
    id: 'record',
    label: 'Combat Record',
    subtitle: 'Career rank progression',
    href: '/record',
  },
  {
    id: 'scoreboard',
    label: 'Scoreboard',
    subtitle: 'Live GitHub telemetry',
    href: '/scoreboard',
  },
  {
    id: 'comms',
    label: 'Comms',
    subtitle: 'Open a channel',
    href: '/comms',
  },
] satisfies readonly NavItem[];

/** The lobby itself — used by the mobile overlay and ESC handling. */
export const lobbyItem = {
  id: 'lobby',
  label: 'Lobby',
  subtitle: 'Main menu',
  href: '/',
} satisfies NavItem;
