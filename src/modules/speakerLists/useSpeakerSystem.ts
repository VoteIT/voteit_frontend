import { computed, MaybeRef, Ref, unref } from 'vue'

import {
  getCurrent,
  getRoomSpeakerSystem,
  speakerLists,
  getRoomSpeakerLists
} from './useSpeakerLists'
import { canManageSystem } from './rules'
import useSpeakerList from './useSpeakerList'
import { speakerSystemType } from './contentTypes'

export default function useSpeakerSystem(
  room: MaybeRef<number>,
  agendaItem?: Ref<number>
) {
  const speakerSystem = computed(() => getRoomSpeakerSystem(unref(room)))
  /**
   * The ID of currently active speaker list on this system
   */
  const systemActiveListId = computed(
    () => speakerSystem.value?.active_list ?? null
  )
  const systemActiveList = computed(() =>
    speakerSystem.value?.active_list
      ? speakerLists.get(speakerSystem.value.active_list)
      : undefined
  )
  const currentlySpeaking = computed(
    () => systemActiveList.value && getCurrent(systemActiveList.value.pk)
  )
  const currentSpeakerQueue = computed(() => systemActiveList.value?.queue)

  const { stopSpeaker } = useSpeakerList(systemActiveListId)
  async function setActiveList(
    system: number,
    active_list: number | null,
    stopActiveSpeaker = false
  ) {
    if (stopActiveSpeaker && systemActiveListId.value) await stopSpeaker()
    await speakerSystemType.update(system, {
      active_list
    })
  }

  return {
    canManageSystem: computed(
      () => speakerSystem.value && canManageSystem(speakerSystem.value)
    ),
    currentSpeakerQueue,
    currentlySpeaking,
    speakerSystem,
    speakerLists: computed(() =>
      getRoomSpeakerLists(unref(room), agendaItem?.value)
    ),
    systemActiveList,
    systemActiveListId,
    setActiveList
  }
}
