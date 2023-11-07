import { computed, Ref } from 'vue'

import useSpeakerLists from './useSpeakerLists'
import { canManageSystem } from './rules'

const { getSystem, getSystemSpeakerLists, getList, getCurrent } =
  useSpeakerLists()

export default function useSpeakerSystem(
  systemId: Ref<number>,
  agendaItem?: Ref<number>
) {
  const speakerSystem = computed(() => getSystem(systemId.value))
  const systemActiveListId = computed(() => speakerSystem.value?.active_list)
  const systemActiveList = computed(
    () =>
      (speakerSystem.value?.active_list &&
        getList(speakerSystem.value.active_list)) ||
      undefined
  )
  const currentlySpeaking = computed(
    () => systemActiveList.value && getCurrent(systemActiveList.value.pk)
  )
  const currentSpeakerQueue = computed(
    () => systemActiveList.value && systemActiveList.value.queue
  )
  const speakerLists = computed(() =>
    systemId.value
      ? getSystemSpeakerLists(systemId.value, agendaItem?.value)
      : []
  )

  return {
    canManageSystem: computed(
      () => speakerSystem.value && canManageSystem(speakerSystem.value)
    ),
    currentSpeakerQueue,
    currentlySpeaking,
    speakerSystem,
    speakerLists,
    systemActiveList,
    systemActiveListId
  }
}
