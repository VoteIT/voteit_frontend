import { computed, Ref } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

import { Speaker, SpeakerSystem } from './types'
import systemMethods from './systemMethods'
import useSpeakerList from './useSpeakerList'
import { enumerate, groupby, map } from 'itertools'
import useSpeakerAnnotations from './useSpeakerAnnotations'
import useMeetingId from '../meetings/useMeetingId'

export default function useSpeakerGroups(
  listId: Ref<number | null>,
  t: ComposerTranslation
) {
  const { speakerSystem, speakerQueue } = useSpeakerList(listId)
  const { annotateSpeaker } = useSpeakerAnnotations(useMeetingId())

  /**
   * Creates a key function to be used by itertools.groupby to create speakerGroups.
   * systemMethods is a half-baked plugin architecture, to be extended at a later point.
   */
  function getGroupKeyFn(system: SpeakerSystem, listId: number) {
    const safePositions = system.safe_positions ?? 0
    const methodKeyFn = systemMethods[system.method_name].getGroupKeyFn(
      t,
      system.settings,
      listId
    )
    return ([position, speaker]: [number, Speaker]) => {
      // Safe positions first, then system method logic.
      return position <= safePositions
        ? t('speaker.lockedPositions')
        : methodKeyFn(speaker)
    }
  }

  /**
   * Speaker groups
   * @example
   * [
   *   { title: 'Safe positions', queue: [1] },
   *   { title: 'List 1': queue: [2, 3] },
   *   { title: 'List 2': queue: [4] }
   * ]
   */
  const speakerGroups = computed(() => {
    if (!speakerSystem.value || !listId.value) return []
    return map(
      groupby(
        enumerate(speakerQueue.value, 1), // Start at position 1
        getGroupKeyFn(speakerSystem.value, listId.value) // Create a key function
      ),
      ([title, posUsers]) => ({
        title, // groupby key is title
        queue: map(posUsers, ([_, speaker]) => annotateSpeaker(speaker))
      })
    ) // Deconstruct enumeration into an array of speakers
  })

  return speakerGroups
}
