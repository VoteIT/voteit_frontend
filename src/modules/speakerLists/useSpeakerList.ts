import { sortBy } from 'lodash'
import { computed, Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { user } from '@/composables/useAuthentication'
import { SpeakerGroup, SpeakerSystemMethod } from './types'
import {
  getCurrent,
  getHistory,
  getTimesSpoken,
  speakerLists,
  speakerSystems
} from './useSpeakerLists'
import { speakerListType } from './contentTypes'
import { canEnterList, canLeaveList, canStartSpeaker } from './rules'

export default function useSpeakerList(listId: Ref<number | undefined>) {
  const { t } = useI18n()

  const speakerHistory = computed(() => {
    if (!listId.value) throw new Error('Speaker history requires list value')
    return getHistory(listId.value)
  })
  const speakerList = computed(() =>
    listId.value ? speakerLists.get(listId.value) : undefined
  )
  const speakerQueue = computed(() => speakerList.value?.queue ?? [])
  const speakerSystem = computed(
    () =>
      speakerList.value && speakerSystems.get(speakerList.value.speaker_system)
  )
  const currentSpeaker = computed(() =>
    listId.value ? getCurrent(listId.value) : undefined
  )
  /**
   * Speaker queue as objects, with user and times spoken
   */
  const annotatedSpeakerQueue = computed(() => {
    if (!listId.value) return []
    const timesSpokenMap = getTimesSpoken(listId.value)
    return speakerQueue.value.map((user) => ({
      user,
      timesSpoken: timesSpokenMap[user] ?? 0
    }))
  })

  const speakerGroups = computed(() => {
    // TODO: Use groupBy logic, so that backend order of speakers is always the truth also in frontend.
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
      function maxListValue({ timesSpoken }: { timesSpoken: number }) {
        return max >= 0 ? Math.min(timesSpoken, max) : timesSpoken
      }
      // Create a list of unique spoken times in order
      const spokenNumbers = sortBy([
        ...new Set(annotatedRestQueue.map(maxListValue))
      ])
      for (const spoken of spokenNumbers) {
        groups.push({
          title: t('speaker.listNumber', spoken + 1),
          queue: annotatedRestQueue
            .filter((entry) => maxListValue(entry) === spoken)
            .map((e) => e.user)
        })
      }
    } else {
      groups.push({
        title: t('speaker.queue'),
        queue: annotatedRestQueue.map(({ user }) => user)
      })
    }
    return groups
  })

  function enterList() {
    return speakerListType.methodCall('enter', { pk: listId.value })
  }
  function leaveList() {
    if (!listId.value) throw new Error('Leave list requires list id')
    return speakerListType.methodCall('leave', { pk: listId.value })
  }

  function moderatorEnterList(user: number) {
    return speakerListType.methodCall('mod_enter', {
      pk: listId.value,
      user
    })
  }
  function moderatorLeaveList(user: number) {
    return speakerListType.methodCall('mod_leave', {
      pk: listId.value,
      user
    })
  }

  // Start by user pk, or first in queue
  function startSpeaker(user?: number) {
    user = user || speakerQueue.value[0]
    speakerListType.methodCall('start_user', {
      pk: listId.value,
      user
    })
  }

  async function stopSpeaker() {
    if (!listId.value)
      throw new Error("Can't stop speaker on undefined list id")
    const current = getCurrent(listId.value)
    if (current) {
      await speakerListType.methodCall('stop_user', {
        pk: listId.value,
        user: current.user
      })
    }
  }

  function undoSpeaker() {
    speakerListType.methodCall('mod_undo', {
      pk: listId.value
    })
  }

  function shuffleList() {
    speakerListType.methodCall('mod_shuffle', {
      pk: listId.value
    })
  }

  const userInQueue = computed(
    () => !!user.value && speakerQueue.value.includes(user.value.pk)
  )

  return {
    annotatedSpeakerQueue,
    canEnterList: computed(
      () =>
        !userInQueue.value &&
        speakerList.value &&
        canEnterList(speakerList.value)
    ),
    canLeaveList: computed(
      () =>
        userInQueue.value &&
        speakerList.value &&
        canLeaveList(speakerList.value)
    ),
    canStartSpeaker: computed(
      () => speakerList.value && canStartSpeaker(speakerList.value)
    ),
    currentSpeaker,
    speakerHistory,
    speakerList,
    speakerGroups,
    speakerSystem,
    speakerQueue,
    enterList,
    leaveList,
    moderatorEnterList,
    moderatorLeaveList,
    startSpeaker,
    stopSpeaker,
    shuffleList,
    undoSpeaker
  }
}
