import { computed, MaybeRef, unref } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

import { speakerAnnotationRegistry } from './registry'

export default function useSpeakerAnnotations(
  meeting: MaybeRef<number>,
  t: ComposerTranslation
) {
  const speakerAnnotator = computed(() =>
    speakerAnnotationRegistry.getAnnotator(unref(meeting), t)
  )
  function annotateSpeaker<T extends { user: number }>(speaker: T) {
    return {
      ...speaker,
      annotations: [...speakerAnnotator.value(speaker.user)]
    }
  }

  return {
    annotateSpeaker
  }
}
