import { ComposerTranslation } from 'vue-i18n'
import { SpeakerSystem, SpeakerSystemMethod } from './types'

interface ISystemMethod {
  getGroupKeyFn(
    t: ComposerTranslation,
    settings: SpeakerSystem['settings']
  ): (speakerEntry: {
    position: number
    user: number
    timesSpoken: number
  }) => string
}

const systemMethods: Record<SpeakerSystemMethod, ISystemMethod> = {
  [SpeakerSystemMethod.Priority]: {
    getGroupKeyFn(t, settings: { max_times: number }) {
      // A speaker system can have a maximum amount of lists. This will get spoken times up to that max value.
      function maxListValue(timesSpoken: number) {
        return settings.max_times > 0
          ? Math.min(timesSpoken, settings.max_times)
          : timesSpoken
      }
      return ({ timesSpoken }) => {
        return t('speaker.listNumber', maxListValue(timesSpoken) + 1)
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
