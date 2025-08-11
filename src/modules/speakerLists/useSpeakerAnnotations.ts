import { computed, MaybeRef, unref } from 'vue'

import { speakerAnnotationRegistry } from './registry'
import { Speaker } from './types'

export default function useSpeakerAnnotations(meeting: MaybeRef<number>) {
  const speakerAnnotator = computed(() =>
    speakerAnnotationRegistry.getAnnotator(unref(meeting))
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
