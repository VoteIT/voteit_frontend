import { ComposerTranslation } from 'vue-i18n'

import { SpeakerSystem, SpeakerSystemMethod } from './types'
import { getTimesSpoken } from './useSpeakerLists'

interface ISystemMethod {
  getGroupKeyFn(
    t: ComposerTranslation,
    settings: SpeakerSystem['settings'],
    listId: number
  ): (speakerEntry: { position: number; user: number }) => string
}

const systemMethods: Record<SpeakerSystemMethod, ISystemMethod> = {
  [SpeakerSystemMethod.Priority]: {
    getGroupKeyFn(t, settings: { max_times: number }, listId) {
      const timesSpokenMap = getTimesSpoken(listId)
      // A speaker system can have a maximum amount of lists. This will get spoken times up to that max value.
      function maxListValue(timesSpoken: number) {
        return settings.max_times > 0
          ? Math.min(timesSpoken, settings.max_times)
          : timesSpoken
      }
      return ({ user }) => {
        return t(
          'speaker.listNumber',
          maxListValue(timesSpokenMap[user] ?? 0) + 1
        )
      }
    }
  },
  [SpeakerSystemMethod.Simple]: {
    getGroupKeyFn(t) {
      return () => t('speaker.queue')
    }
  }
}

export default systemMethods
