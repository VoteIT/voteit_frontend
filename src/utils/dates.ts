import { currentLocale } from './locales'

/* Same options as luxon's presets, so output stays unchanged. */
export const DATE_SHORT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
}
export const DATE_FULL: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}
export const DATETIME_SHORT: Intl.DateTimeFormatOptions = {
  ...DATE_SHORT,
  hour: 'numeric',
  minute: 'numeric'
}
export const DATETIME_LONG: Intl.DateTimeFormatOptions = {
  dateStyle: 'long',
  timeStyle: 'long'
}

const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/**
 * Locale to format dates with. Prefers the browser's regional variant of the
 * app language (e.g. "en-GB" for "en"), so date order follows the user's region.
 */
export function formatLocale(locale: string = currentLocale.value): string {
  return navigator.languages.find((l) => l.split('-')[0] === locale) ?? locale
}

/** Parse an ISO date string to epoch milliseconds. */
export function parseISO(iso: string): number {
  return new Date(iso).getTime()
}

/** Format an ISO date string (or epoch ms) in the current locale. */
export function formatDate(
  date: string | number,
  options: Intl.DateTimeFormatOptions = DATE_SHORT
): string {
  return new Date(date).toLocaleString(formatLocale(), options)
}

// Approximate lengths for long units. Calendar accuracy isn't needed for "x ago" labels.
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * DAY],
  ['month', 30 * DAY],
  ['week', 7 * DAY],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
  ['second', SECOND]
]

/**
 * Format a time difference as relative time, e.g. "3 minutes ago" or "in 2 days".
 * Picks the largest unit with a whole count and truncates, like luxon's toRelative().
 * @param diff Target time minus base time, in milliseconds. Negative is in the past.
 */
export function formatRelative(diff: number): string {
  const rtf = new Intl.RelativeTimeFormat(formatLocale(), { numeric: 'always' })
  for (const [unit, ms] of RELATIVE_UNITS) {
    const count = Math.trunc(diff / ms)
    if (Math.abs(count) >= 1) return rtf.format(count, unit)
  }
  // Less than a second. Signed zero gives "0 seconds ago" or "in 0 seconds".
  return rtf.format(diff < 0 ? -0 : 0, 'second')
}
