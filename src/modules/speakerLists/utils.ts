import { ComposerTranslation } from 'vue-i18n'

import { SpeakerSystemMethod } from './types'

/**
 * Translation method to avoid dynamic translation strings
 */
export function translateOrderMethod(
  method: SpeakerSystemMethod,
  t: ComposerTranslation
) {
  switch (method) {
    case 'gender_prio':
      return {
        title: t('speaker.orderMethod.genderPriority'),
        description: t('speaker.orderMethod.genderPriorityDescription')
      }
    case 'priority':
      return {
        title: t('speaker.orderMethod.priority'),
        description: t('speaker.orderMethod.priorityDescription')
      }
    case 'simple':
      return {
        title: t('speaker.orderMethod.simple'),
        description: t('speaker.orderMethod.simpleDescription')
      }
  }
  throw new Error(`Unknown order method ${method}`)
}
