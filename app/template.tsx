/*
  Route transition: templates remount on every navigation, so this wrapper
  replays the screen-enter animation (fade + 24px slide, --dur-route) each
  time a screen comes up. Reduced motion swaps it for a 120ms fade via the
  globals.css motion block. Server component — no JS shipped.
*/
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="screen-enter">{children}</div>;
}
