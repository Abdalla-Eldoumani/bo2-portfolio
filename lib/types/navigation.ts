// Destination list the lobby menu, mobile overlay and hint bar consume. Each
// item is a BO2 main-menu entry pointing at a full-viewport screen route.

export interface NavItem {
  id: string; // screen id, e.g. "missions"
  label: string; // BO2 main-menu label
  subtitle: string; // one-line descriptor (mobile overlay)
  href: string; // real route, e.g. "/missions"
}
