/** Event date helpers. Everything here reads the UTC calendar day, the same
 *  day the iCalendar feed and the Event JSON-LD use, so a plain
 *  `date: 2026-06-06` is June 6 wherever the site is built. */

/** One calendar day as text, in the site locale. */
export function formatEventDay(d: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(d);
}
