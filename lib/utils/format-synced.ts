// "Last synced" formatter for the GitHub scoreboard stamp. Pure: the output
// derives only from the passed ISO timestamp (no clock read, no I/O), so it is
// trivially testable and cache-safe.
//
// `locale` is a parameter because the server has no visitor locale; Phase 8
// supplies one (from params / Accept-Language / client render). Passing
// `undefined` uses the runtime default locale as a placeholder.
export function formatSynced(iso: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
