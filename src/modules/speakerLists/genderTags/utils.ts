import { ComposerTranslation } from 'vue-i18n'

export const GENDER_ICONS = {
  f: 'mdi-gender-female',
  m: 'mdi-gender-male',
  nb: 'mdi-gender-non-binary'
} as const

export function translateGender(t: ComposerTranslation, tag: GenderTag) {
  switch (tag) {
    case 'f':
      return t('speaker.gender.female')
    case 'm':
      return t('speaker.gender.male')
    case 'nb':
      return t('speaker.gender.nonBinary')
    default:
      return tag
  }
}

export function getGenderIcon(tag?: GenderTag) {
  return tag ? GENDER_ICONS[tag] : 'mdi-gender-male-female'
}
