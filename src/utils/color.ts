/**
 * Colour channels, 0-255. Same shape as Vuetify's own and the object model of
 * v-color-picker.
 */
export interface RGB {
  r: number
  g: number
  b: number
}

/** WCAG AA contrast for normal text */
export const MIN_CONTRAST = 4.5

export const WHITE: RGB = { r: 255, g: 255, b: 255 }

export function parseHex(hex: string): RGB {
  let value = hex.replace(/^#/, '')
  if (value.length === 3) value = [...value].map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Invalid colour: ${hex}`)
  const n = parseInt(value, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * Vuetify keeps theme colours in CSS variables as bare channels, to be used
 * as rgb(var(--v-theme-x)) or rgba(var(--v-theme-x), .4)
 */
export function toCssChannels({ r, g, b }: RGB) {
  return `${r},${g},${b}`
}

/** @see https://www.w3.org/TR/WCAG20/#relativeluminancedef */
export function relativeLuminance({ r, g, b }: RGB) {
  const [R, G, B] = [r, g, b].map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/** Contrast ratio, 1-21. @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef */
export function contrastRatio(a: RGB, b: RGB) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x
  )
  return (light + 0.05) / (dark + 0.05)
}

export function hasWhiteTextContrast(color: RGB) {
  return contrastRatio(color, WHITE) >= MIN_CONTRAST
}

/** amount 0 = unchanged, 1 = white */
export function mixWithWhite({ r, g, b }: RGB, amount: number): RGB {
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return { r: mix(r), g: mix(g), b: mix(b) }
}
