import { ComposerTranslation } from 'vue-i18n'

/**
 * Translation method to avoid dynamic translation strings
 */
export function translateOrderMethod (method: string, t: ComposerTranslation): string {
  switch (method) {
    case 'priority':
      return t('speaker.orderMethod.priority')
    case 'simple':
      return t('speaker.orderMethod.simple')
  }
  throw new Error(`Unknown order method ${method}`)
}
