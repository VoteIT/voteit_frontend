import { describe, expect, it } from 'vitest'

import {
  contrastRatio,
  hasWhiteTextContrast,
  mixWithWhite,
  parseHex,
  toCssChannels
} from './color'

describe('parseHex', () => {
  it('parses long and short hex', () => {
    expect(parseHex('#563661')).toEqual({ r: 86, g: 54, b: 97 })
    expect(parseHex('fff')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('throws on invalid colour', () => {
    expect(() => parseHex('#56366')).toThrow()
    expect(() => parseHex('purple')).toThrow()
  })
})

describe('toCssChannels', () => {
  it('formats channels the way Vuetify theme variables do', () => {
    expect(toCssChannels({ r: 86, g: 54, b: 97 })).toBe('86,54,97')
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white, either way round', () => {
    expect(contrastRatio(parseHex('#000'), parseHex('#fff'))).toBeCloseTo(21)
    expect(contrastRatio(parseHex('#fff'), parseHex('#000'))).toBeCloseTo(21)
  })

  it('matches known WCAG values', () => {
    expect(contrastRatio(parseHex('#767676'), parseHex('#fff'))).toBeCloseTo(
      4.54,
      2
    )
  })
})

describe('hasWhiteTextContrast', () => {
  it('accepts dark colours', () => {
    expect(hasWhiteTextContrast(parseHex('#563661'))).toBe(true)
    expect(hasWhiteTextContrast(parseHex('#767676'))).toBe(true)
  })

  it('rejects light colours', () => {
    expect(hasWhiteTextContrast(parseHex('#ffff00'))).toBe(false)
    expect(hasWhiteTextContrast(parseHex('#777777'))).toBe(false)
  })
})

describe('mixWithWhite', () => {
  it('mixes towards white', () => {
    const color = parseHex('#563661')
    expect(mixWithWhite(color, 0)).toEqual(color)
    expect(mixWithWhite(color, 1)).toEqual({ r: 255, g: 255, b: 255 })
    expect(mixWithWhite({ r: 0, g: 100, b: 255 }, 0.5)).toEqual({
      r: 128,
      g: 178,
      b: 255
    })
  })
})
