import { computed, MaybeRef, unref } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

import { speakerAnnotationRegistry } from './registry'
import { Speaker } from './types'

export default function useSpeakerAnnotations(
  meeting: MaybeRef<number>,
  t: ComposerTranslation
) {
  const speakerAnnotator = computed(() =>
    speakerAnnotationRegistry.getAnnotator(unref(meeting), t)
  )
  function annotateSpeaker<T extends Speaker>(speaker: T) {
    return {
      ...speaker,
      annotations: [...speakerAnnotator.value(speaker.user)]
    }
  }

  return {
    annotateSpeaker
  }
}
