import { sortBy } from 'lodash'
import { computed, Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { SpeakerGroup, SpeakerSystemMethod } from './types'
import useSpeakerLists from './useSpeakerLists'

const { getHistory, getList, getCurrent, getSystem, getTimesSpoken } = useSpeakerLists()

export default function useSpeakerList (list: Ref<number | undefined>) {
  const { t } = useI18n()

  const speakerHistory = computed(() => {
    if (!list.value) throw new Error('Speaker history requires list value')
    return getHistory(list.value)
  })
  const speakerList = computed(() => list.value ? getList(list.value) : undefined)
  const speakerQueue = computed(() => speakerList.value?.queue ?? [])
  const speakerSystem = computed(() => speakerList.value && getSystem(speakerList.value.speaker_system))
  const currentSpeaker = computed(() => list.value ? getCurrent(list.value) : undefined)
  // Annotate speaker queue with times spoken
  const annotatedSpeakerQueue = computed(() => {
    return speakerQueue.value.map(user => ({
      user,
      timesSpoken: timesSpokenMap.value[user] || 0
    }))
  })

  const speakerGroups = computed(() => {
    // Support priority lists
    if (!speakerSystem.value) return
    const safePositions = speakerSystem.value.safe_positions ?? 0
    const groups: SpeakerGroup[] = []
    if (safePositions) {
      groups.push({
        title: t('speaker.lockedPositions'),
        queue: annotatedSpeakerQueue.value
          .slice(0, speakerSystem.value.safe_positions)
          .map(({ user }) => user)
      })
    }
    const annotatedRestQueue = annotatedSpeakerQueue.value.slice(safePositions)
    // TODO: Move this into plugin architecture
    if (speakerSystem.value.method_name === SpeakerSystemMethod.Priority) {
      const max = speakerSystem.value.settings?.max_times ?? 0
      // A speaker system can have a maximum amount of lists. This will get spoken times up to that max value.
      function maxListValue ({ timesSpoken }: { timesSpoken: number }) {
        return max >= 0
          ? Math.min(timesSpoken, max)
          : timesSpoken
      }
      // Create a list of unique spoken times in order
      const spokenNumbers = sortBy([...new Set(annotatedRestQueue.map(maxListValue))])
      for (const spoken of spokenNumbers) {
        groups.push({
          title: t('speaker.listNumber', spoken + 1),
          queue: annotatedRestQueue
            .filter(entry => maxListValue(entry) === spoken)
            .map(e => e.user)
        })
      }
    } else {
      groups.push({
        title: t('speaker.queue'),
        queue: annotatedRestQueue
          .map(({ user }) => user)
      })
    }
    return groups
  })

  const timesSpokenMap = computed(() => {
    if (!list.value) throw new Error('Times spoken requires list id')
    return getTimesSpoken(list.value)
  })

  return {
    annotatedSpeakerQueue,
    currentSpeaker,
    speakerHistory,
    speakerList,
    speakerGroups,
    speakerQueue
  }
}
