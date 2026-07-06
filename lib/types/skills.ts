// Skills modeled as a BO2 "create-a-class" loadout (Phase 5). The 37 technical
// skill names distribute across primary/secondary/perks; wildcards carry the
// non-technical differentiators.

export type LoadoutSlot = 'primary' | 'secondary' | 'perks' | 'wildcards';

// A non-technical differentiator card (e.g. a way of working), distinct from
// the plain skill-name strings in the other slots because it needs copy.
export interface Wildcard {
  name: string;
  note: string;
}

export interface Loadout {
  primary: string[];
  secondary: string[];
  perks: string[];
  wildcards: Wildcard[];
}
