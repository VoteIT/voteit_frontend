import { sortBy } from 'lodash'
import { computed, Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { SpeakerGroup, SpeakerSystemMethod } from './types'
import useSpeakerLists from './useSpeakerLists'

const { getHistory, getQueue, getList, getCurrent, getSystem } = useSpeakerLists()

export default function useSpeakerList (list: Ref<number | undefined>) {
  const { t } = useI18n()

  const speakerHistory = computed(() => list.value ? getHistory(list.value) : [])
  const speakerList = computed(() => list.value ? getList(list.value) : undefined)
  const speakerQueue = computed(() => list.value ? getQueue(list.value) : [])
  const speakerSystem = computed(() => speakerList.value && getSystem(speakerList.value.speaker_system))
  const currentSpeaker = computed(() => list.value ? getCurrent(list.value) : undefined)
  // Annotate speaker queue with times spoken
  const annotatedSpeakerQueue = computed(() => {
    return speakerQueue.value.map(user => ({
      user,
      timesSpoken: (speakerHistory.value ?? []).filter(([pk]) => pk === user).length
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
      const max = (speakerSystem.value.settings?.max_times ?? 0) - 1
      function maxListValue ({ timesSpoken }: { timesSpoken: number }) {
        return max >= 0
          ? Math.min(timesSpoken, max)
          : timesSpoken
      }
      const spokenNumbers = sortBy([...new Set(annotatedSpeakerQueue.value.map(maxListValue))])
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

  return {
    annotatedSpeakerQueue,
    currentSpeaker,
    speakerHistory,
    speakerList,
    speakerGroups,
    speakerQueue
  }
}
