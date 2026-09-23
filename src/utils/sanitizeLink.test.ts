import { describe, expect, it } from 'vitest'

import { sanitizeLink } from './sanitizeLink'

describe('sanitizeLink', () => {
  it('keeps absolute URLs with allowed protocols', () => {
    expect(sanitizeLink('https://a.se/x')).toBe('https://a.se/x')
    expect(sanitizeLink('http://a.se')).toBe('http://a.se')
    expect(sanitizeLink('mailto:a@b.se')).toBe('mailto:a@b.se')
  })

  it('keeps root-relative paths', () => {
    expect(sanitizeLink('/m/1/meeting')).toBe('/m/1/meeting')
  })

  it('prefixes values without protocol with https://', () => {
    expect(sanitizeLink('example.com')).toBe('https://example.com')
    expect(sanitizeLink('  example.com/path  ')).toBe(
      'https://example.com/path'
    )
    expect(sanitizeLink('example.com:8080')).toBe('https://example.com:8080')
    expect(sanitizeLink('//example.com')).toBe('https://example.com')
  })

  it('rejects unsafe or empty values', () => {
    expect(sanitizeLink('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeLink('data:text/html,x')).toBeUndefined()
    expect(sanitizeLink('')).toBeUndefined()
    expect(sanitizeLink('   ')).toBeUndefined()
  })
})
