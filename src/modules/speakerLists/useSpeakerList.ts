import { computed, MaybeRef, unref } from 'vue'

import useAuthStore from '../auth/useAuthStore'

import { isQueuedSpeaker } from './types'
import {
  getCurrent,
  getHistory,
  getRoomSpeakerSystem,
  speakerApi,
  speakerLists,
  userToSpeaker
} from './useSpeakerLists'
import { speakerListType } from './contentTypes'
import { canEnterList, canLeaveList, canStartSpeaker } from './rules'

export default function useSpeakerList(listId: MaybeRef<number | null>) {
  const authStore = useAuthStore()

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

  /**
   * Not exported
   */
  const currentSpeaker = computed(() => {
    const list = unref(listId)
    if (!list) return
    return getCurrent(list)
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

  const userIsCurrentSpeaker = computed(
    () => speakerList.value?.current === authStore.user?.pk
  )

  const userInQueue = computed(
    () =>
      !userIsCurrentSpeaker.value &&
      !!authStore.user &&
      userQueue.value.includes(authStore.user.pk)
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
    speakerHistory,
    speakerList,
    speakerSystem,
    speakerQueue,
    userQueue,
    enterList,
    leaveList,
    startSpeaker,
    stopSpeaker,
    undoSpeaker
  }
}
