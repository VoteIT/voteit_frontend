import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  DATE_FULL,
  DATETIME_SHORT,
  DAY,
  formatDate,
  formatLocale,
  formatRelative
} from './dates'

const MINUTE = 60_000

afterEach(() => {
  vi.restoreAllMocks()
})

describe('formatRelative', () => {
  test('past', () => {
    expect(formatRelative(-500)).toBe('0 seconds ago')
    expect(formatRelative(-59_999)).toBe('59 seconds ago')
    expect(formatRelative(-MINUTE)).toBe('1 minute ago')
    expect(formatRelative(-119 * MINUTE)).toBe('1 hour ago')
    expect(formatRelative(-3 * DAY)).toBe('3 days ago')
    expect(formatRelative(-8 * DAY)).toBe('1 week ago')
  })

  test('future', () => {
    expect(formatRelative(0)).toBe('in 0 seconds')
    expect(formatRelative(5 * MINUTE)).toBe('in 5 minutes')
    expect(formatRelative(2 * DAY)).toBe('in 2 days')
  })
})

describe('formatDate', () => {
  // Midday local time, so the date is the same in every timezone
  const iso = '2026-03-05T12:30:00'

  test('presets', () => {
    expect(formatDate(iso)).toBe('3/5/2026')
    expect(formatDate(iso, DATE_FULL)).toBe('March 5, 2026')
    expect(formatDate(iso, DATETIME_SHORT)).toBe('3/5/2026, 12:30 PM')
  })

  test('uses regional variant from browser', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['sv-SE', 'en-GB'])
    expect(formatLocale('en')).toBe('en-GB')
    expect(formatLocale('sv')).toBe('sv-SE')
    expect(formatLocale('de')).toBe('de')
    expect(formatDate(iso)).toBe('05/03/2026')
  })
})
