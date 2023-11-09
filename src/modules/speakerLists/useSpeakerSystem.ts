import { computed, ref, Ref } from 'vue'

import {
  getCurrent,
  getSystemSpeakerLists,
  speakerLists,
  speakerSystems
} from './useSpeakerLists'
import { canManageSystem } from './rules'
import { SpeakerList } from './types'
import useSpeakerList from './useSpeakerList'
import { speakerListType } from './contentTypes'

export default function useSpeakerSystem(
  systemId: Ref<number>,
  agendaItem?: Ref<number>
) {
  const speakerSystem = computed(() => speakerSystems.get(systemId.value))
  const systemActiveListId = computed(() => speakerSystem.value?.active_list)
  const systemActiveList = computed(() =>
    speakerSystem.value?.active_list
      ? speakerLists.get(speakerSystem.value.active_list)
      : undefined
  )
  const currentlySpeaking = computed(
    () => systemActiveList.value && getCurrent(systemActiveList.value.pk)
  )
  const currentSpeakerQueue = computed(
    () => systemActiveList.value && systemActiveList.value.queue
  )

  async function setActiveList(list: SpeakerList, stopActiveSpeaker = false) {
    if (stopActiveSpeaker) {
      const system = speakerSystems.get(list.speaker_system)
      if (system?.active_list)
        await useSpeakerList(ref(system.active_list)).stopSpeaker()
    }
    await speakerListType.methodCall('set_active', { pk: list.pk })
  }

  return {
    canManageSystem: computed(
      () => speakerSystem.value && canManageSystem(speakerSystem.value)
    ),
    currentSpeakerQueue,
    currentlySpeaking,
    speakerSystem,
    speakerLists: computed(() =>
      systemId.value
        ? getSystemSpeakerLists(systemId.value, agendaItem?.value)
        : []
    ),
    systemActiveList,
    systemActiveListId,
    setActiveList
  }
}
