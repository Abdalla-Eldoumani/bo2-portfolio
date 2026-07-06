// "Last synced" formatter for the GitHub scoreboard stamp. Pure: the output
// derives only from the passed ISO timestamp (no clock read, no I/O), so it is
// trivially testable and cache-safe.
//
// `locale` is a parameter because the server has no visitor locale; Phase 8
// supplies one (from params / Accept-Language / client render). Passing
// `undefined` uses the runtime default locale as a placeholder.
export function formatSynced(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  };
  // A malformed locale (e.g. an untrusted Accept-Language value in Phase 8) makes
  // Intl.DateTimeFormat throw RangeError; fall back to the runtime default rather
  // than crash the render this stamp is meant to keep alive.
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(date);
  }
}
