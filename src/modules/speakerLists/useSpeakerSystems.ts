import { computed, Ref } from 'vue'
import useSpeakerLists from './useSpeakerLists'

const { getSystems } = useSpeakerLists()

export default function useSpeakerSystems (meeting: Ref<number>) {
  const activeSpeakerSystems = computed(() => getSystems(meeting.value))
  const allSpeakerSystems = computed(() => getSystems(meeting.value, true))
  const hasSpeakerSystems = computed(() => !!allSpeakerSystems.value.length)

  return {
    activeSpeakerSystems,
    allSpeakerSystems,
    hasSpeakerSystems
  }
}
