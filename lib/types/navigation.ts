// Section list the Phase 4 navigation rail consumes. Each item is a BO2
// main-menu entry that deep-links to a section anchor on the single page.

export interface NavItem {
  id: string; // section anchor, e.g. "lobby"
  label: string; // BO2 main-menu label
  subtitle: string; // one-line descriptor under the label
  href: string; // "#id" deep link
}
