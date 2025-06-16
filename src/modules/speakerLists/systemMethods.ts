import { ComposerTranslation } from 'vue-i18n'

import { Speaker, SpeakerSystem, SpeakerSystemMethod } from './types'
import { timesSpokenGetter } from './useSpeakerLists'

interface ISystemMethod {
  getGroupKeyFn(
    t: ComposerTranslation,
    settings: SpeakerSystem['settings'],
    listId: number
  ): (speaker: Speaker) => string
}

const systemMethods: Record<SpeakerSystemMethod, ISystemMethod> = {
  [SpeakerSystemMethod.Priority]: {
    getGroupKeyFn(t, settings: { max_times: number }, listId) {
      const timesSpoken = timesSpokenGetter(listId)
      // A speaker system can have a maximum amount of lists. This will get spoken times up to that max value.
      function maxListValue(user: number) {
        const spoken = timesSpoken(user)
        return settings.max_times > 0
          ? Math.min(spoken, settings.max_times)
          : spoken
      }
      return (speaker) =>
        t('speaker.listNumber', maxListValue(speaker.user) + 1)
    }
  },
  [SpeakerSystemMethod.Simple]: {
    getGroupKeyFn(t) {
      return () => t('speaker.queue')
    }
  }
}

export default systemMethods
