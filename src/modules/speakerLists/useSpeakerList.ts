import { computed, MaybeRef, unref } from 'vue'

import { user } from '@/composables/useAuthentication'
import useMeetingId from '../meetings/useMeetingId'
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
import useSpeakerAnnotations from './useSpeakerAnnotations'

export default function useSpeakerList(listId: MaybeRef<number | null>) {
  const { annotateSpeaker } = useSpeakerAnnotations(useMeetingId())

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
    if (!list) return
    const speaker = getCurrent(list)
    if (speaker) return annotateSpeaker(speaker)
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
    () => speakerList.value?.current === user.value?.pk
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
