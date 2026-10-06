import { computed } from 'vue'

import { mixWithWhite, type RGB, toCssChannels } from '@/utils/color'

import useOrgStore from './useOrgStore'

/**
 * Stylesheet overriding Vuetify's app-bar theme variables. Vuetify redeclares
 * them on every element with the theme class - v-app, but also toolbars,
 * drawers, lists, sheets... - so an inline style on v-app would be shadowed.
 * The :root prefix outranks Vuetify's own .v-theme--light rule.
 */
function getThemeStyles(profileColor?: RGB) {
  if (!profileColor) return ''
  const vars = {
    '--v-theme-app-bar': toCssChannels(profileColor),
    // Profile colours are checked for contrast with white text
    '--v-theme-on-app-bar': '255,255,255',
    '--v-theme-app-bar-overlay-multiplier': 2,
    '--v-theme-app-bar-divider': toCssChannels(
      mixWithWhite(profileColor, 0.15)
    ),
    '--v-theme-app-bar-active': toCssChannels(mixWithWhite(profileColor, 0.3))
  }
  const declarations = Object.entries(vars)
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ')
  return `:root .v-theme--light { ${declarations} }`
}

export function isSvgFile(file: File) {
  return file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)
}

export default function useOrgProfile() {
  const orgStore = useOrgStore()

  const profileColor = computed(() => orgStore.organisation?.colors?.appBar)
  const themeStyles = computed(() => getThemeStyles(profileColor.value))

  /**
   * Only ever display the logo through <img>, where scripts in the SVG don't
   * run - never fetch it and inline it in the DOM.
   */
  const logoUrl = computed(() => orgStore.organisation?.logo || undefined)

  /** Undefined returns to the theme default */
  async function setProfileColor(color?: RGB) {
    const colors = { ...orgStore.organisation?.colors }
    if (color) colors.appBar = { r: color.r, g: color.g, b: color.b }
    else delete colors.appBar
    await orgStore.updateOrganisation({ colors })
  }

  /** Undefined removes the logo */
  async function setLogo(file?: File) {
    if (file && !isSvgFile(file)) throw new Error('Logo must be an SVG file')
    await orgStore.setLogo(file ?? '')
  }

  return {
    logoUrl,
    profileColor,
    themeStyles,
    setLogo,
    setProfileColor
  }
}
