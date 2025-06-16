import { enumerate, groupby, map } from 'itertools'
import { computed, MaybeRef, Ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'

import { user } from '@/composables/useAuthentication'
import { isQueuedSpeaker, Speaker, SpeakerSystem } from './types'
import {
  getCurrent,
  getHistory,
  getRoomSpeakerSystem,
  speakerApi,
  speakerLists,
  speakerSystems,
  userToSpeaker
} from './useSpeakerLists'
import { speakerListType, speakerType } from './contentTypes'
import { canEnterList, canLeaveList, canStartSpeaker } from './rules'
import systemMethods from './systemMethods'

export default function useSpeakerList(listId: MaybeRef<number | null>) {
  const { t } = useI18n()

  const speakerHistory = computed(() => {
    const list = unref(listId)
    if (!list) throw new Error('Speaker history requires list value')
    return getHistory(list)
  })
  const speakerList = computed(() => {
    const list = unref(listId)
    return list ? speakerLists.get(list) : undefined
  })
  const userQueue = computed(() => speakerList.value?.queue ?? [])
  const speakerQueue = computed(() => {
    const list = unref(listId)
    if (!list) throw new Error('No listID, cant get speaker queue')
    return userQueue.value
      .map((user) => userToSpeaker(list, user))
      .filter(isQueuedSpeaker)
  })
  const speakerSystem = computed(
    () => speakerList.value && getRoomSpeakerSystem(speakerList.value.room)
  )
  const currentSpeaker = computed(() => {
    const list = unref(listId)
    return list ? getCurrent(list) : undefined
  })

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
    const list = unref(listId)
    if (!speakerSystem.value || !list) return []
    return map(
      groupby(
        enumerate(speakerQueue.value, 1), // Start at position 1
        getGroupKeyFn(speakerSystem.value, list) // Create a key function
      ),
      ([title, posUsers]) => ({
        title, // groupby key is title
        queue: map(posUsers, ([_, speaker]) => speaker) // Deconstruct enumeration into an array of speakers
      })
    )
  })

  function enterList() {
    const list = unref(listId)
    if (!list) throw new Error('Enter list requires list id')
    return speakerListType.api.action(list, 'enter')
  }
  function leaveList() {
    const list = unref(listId)
    if (!list) throw new Error('Leave list requires list id')
    return speakerListType.api.action(list, 'leave')
  }

  // Start by user pk, or first in queue
  function startSpeaker(speaker?: number) {
    speaker = speaker || speakerQueue.value.at(0)?.pk
    if (!speaker) throw new Error('No speaker to start')
    return speakerApi.start(speaker)
  }

  async function stopSpeaker() {
    if (!currentSpeaker.value)
      throw new Error('No current speaker found on this list')
    await speakerApi.stop(currentSpeaker.value.pk)
  }

  function undoSpeaker() {
    if (!currentSpeaker.value)
      throw new Error('No current speaker found on this list')
    return speakerApi.undo(currentSpeaker.value.pk)
  }

  function shuffleList() {
    const list = unref(listId)
    if (!list) throw new Error('No list id to shuffle')
    return speakerListType.api.action(list, 'shuffle')
  }

  const userIsCurrentSpeaker = computed(
    () => currentSpeaker.value?.user === user.value?.pk
  )

  const userInQueue = computed(
    () =>
      !userIsCurrentSpeaker.value &&
      !!user.value &&
      userQueue.value.includes(user.value.pk)
  )

  return {
    canEnterList: computed(
      () =>
        !userInQueue.value &&
        !userIsCurrentSpeaker.value &&
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
    userQueue,
    enterList,
    leaveList,
    startSpeaker,
    stopSpeaker,
    shuffleList,
    undoSpeaker
  }
}
