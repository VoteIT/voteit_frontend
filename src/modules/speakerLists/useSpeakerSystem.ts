import { computed, Ref } from 'vue'
import { canAddSpeakerList, isSystemModerator } from './rules'
import useSpeakerLists from './useSpeakerLists'

const { getSystem, getList, getQueue, getCurrent } = useSpeakerLists()

export default function useSpeakerSystem (systemId: Ref<number>) {
  const speakerSystem = computed(() => getSystem(systemId.value))
  const currentActiveListId = computed(() => speakerSystem.value?.active_list)
  const currentActiveList = computed(() => currentActiveListId.value ? getList(currentActiveListId.value) : undefined)
  const currentlySpeaking = computed(() => currentActiveList.value && getCurrent(currentActiveList.value.pk))
  const currentSpeakerQueue = computed(() => currentActiveList.value && getQueue(currentActiveList.value.pk))
  const isModerator = computed(() => !!speakerSystem.value && isSystemModerator(speakerSystem.value))

  return {
    canAddSpeakerList: computed(() => speakerSystem.value && canAddSpeakerList(speakerSystem.value)),
    currentActiveList,
    currentActiveListId,
    currentSpeakerQueue,
    currentlySpeaking,
    isModerator,
    speakerSystem
  }
}
