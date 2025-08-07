import { ComposerTranslation } from 'vue-i18n'

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
