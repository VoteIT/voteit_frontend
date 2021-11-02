import { computed, Ref } from 'vue'
import { isSystemModerator } from './rules'
import useSpeakerLists from './useSpeakerLists'

const { getSystem, getList, getQueue, getCurrent } = useSpeakerLists()

export default function useSpeakerSystem (systemId: Ref<number>) {
  const speakerSystem = computed(() => getSystem(systemId.value))
  const currentActiveList = computed(() => {
    if (!speakerSystem.value?.active_list) return
    return getList(speakerSystem.value.active_list)
  })
  const currentlySpeaking = computed(() => currentActiveList.value && getCurrent(currentActiveList.value))
  const currentSpeakerQueue = computed(() => currentActiveList.value && getQueue(currentActiveList.value))
  const isModerator = computed(() => !!speakerSystem.value && isSystemModerator(speakerSystem.value))

  return {
    currentActiveList,
    currentSpeakerQueue,
    currentlySpeaking,
    isModerator,
    speakerSystem
  }
}
