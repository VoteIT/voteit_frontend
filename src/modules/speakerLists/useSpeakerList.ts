import { enumerate, groupby, imap, map } from 'itertools'
import { computed, Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { user } from '@/composables/useAuthentication'
import { SpeakerSystem } from './types'
import {
  getCurrent,
  getHistory,
  getTimesSpoken,
  speakerLists,
  speakerSystems
} from './useSpeakerLists'
import { speakerListType } from './contentTypes'
import { canEnterList, canLeaveList, canStartSpeaker } from './rules'
import systemMethods from './systemMethods'

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

  /**
   * Creates a key function to be used by itertools.groupby to create speakerGroups.
   * systemMethods is a half-baked plugin architecture, to be extended at a later point.
   */
  function getGroupKeyFn(system: SpeakerSystem) {
    const safePositions = system.safe_positions ?? 0
    const methodKeyFn = systemMethods[system.method_name].getGroupKeyFn(
      t,
      system.settings
    )
    return (speakerEntry: {
      position: number
      user: number
      timesSpoken: number
    }) => {
      // Safe positions first, then system method logic.
      return speakerEntry.position <= safePositions
        ? t('speaker.lockedPositions')
        : methodKeyFn(speakerEntry)
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
    if (!speakerSystem.value) return []
    const keyFn = getGroupKeyFn(speakerSystem.value) // Create a key function
    return map(
      groupby(
        imap(
          enumerate(annotatedSpeakerQueue.value, 1), // Start at position 1
          ([position, speaker]) => ({ position, ...speaker }) // Join into one object
        ), // This is an iterator of speakerEntry
        keyFn
      ),
      ([title, entries]) => ({
        title, // groupby key is title
        queue: map(entries, (e) => e.user) // Deconstruct into an array of users (number[])
      })
    )
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
