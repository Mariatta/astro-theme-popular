/** Event date helpers, mirroring partials/event-dates.html,
 *  event-date-text.html and events-split.html on the Hugo side. An event runs
 *  from `date` to the optional `endDate` (both calendar days, inclusive).
 *  Everything here reads the UTC calendar day, the same day the iCalendar
 *  feed and the Event JSON-LD use, so a plain `date: 2026-06-06` is June 6
 *  wherever the site is built. */

export interface EventSpan { date: Date; endDate?: Date | null }

const DAY_MS = 86400000;
const dayStart = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/** One calendar day as text, in the site locale. */
export function formatEventDay(d: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(d);
}

/** YYYY-MM-DD of the UTC calendar day. */
export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The event's last day: `endDate` when it is on a later day than `date`,
 *  else `date`. An `endDate` before `date` is ignored. */
export function eventLastDay(e: EventSpan): Date {
  return e.endDate && dayStart(e.endDate) > dayStart(e.date) ? e.endDate : e.date;
}

export function isMultiDay(e: EventSpan): boolean {
  return dayStart(eventLastDay(e)) > dayStart(e.date);
}

/** Every calendar day of the event, as UTC midnights. */
export function eventDays(e: EventSpan): Date[] {
  const days: Date[] = [];
  for (let t = dayStart(e.date); t <= dayStart(eventLastDay(e)); t += DAY_MS) days.push(new Date(t));
  return days;
}

/** Upcoming or past. A one-day event is past once its `date` has passed. A
 *  multi-day event stays upcoming through the end of its last day, so it does
 *  not drop to "past" partway through the weekend. */
export function isUpcomingEvent(e: EventSpan, now: Date | number): boolean {
  return isMultiDay(e) ? dayStart(eventLastDay(e)) + DAY_MS > +now : +e.date >= +now;
}

/** "Saturday, Jun 6, 2026", or "Saturday, Jun 6 – Sunday, Jun 7, 2026" for a
 *  multi-day event (Intl writes a shared month or year once). When the
 *  options carry no year, as in the event row, a span across New Year stays
 *  "Dec 31 – Jan 2" instead of gaining both years, matching Hugo. */
export function formatEventDates(e: EventSpan, locale: string, options: Intl.DateTimeFormatOptions): string {
  if (!isMultiDay(e)) return formatEventDay(e.date, locale, options);
  const last = eventLastDay(e);
  if (!options.year && e.date.getUTCFullYear() !== last.getUTCFullYear()) {
    return `${formatEventDay(e.date, locale, options)} – ${formatEventDay(last, locale, options)}`;
  }
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).formatRange(e.date, last);
}
