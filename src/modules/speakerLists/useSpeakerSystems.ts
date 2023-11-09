import { computed, Ref } from 'vue'
import { isSystemModerator } from './rules'
import { SpeakerSystemState } from './types'
import useSpeakerLists from './useSpeakerLists'

const { getSystems } = useSpeakerLists()

export default function useSpeakerSystems(meeting: Ref<number>) {
  const activeSpeakerSystems = computed(() =>
    getSystems(
      meeting.value,
      (system) => system.state === SpeakerSystemState.Active
    )
  )
  const allSpeakerSystems = computed(() => getSystems(meeting.value))
  const hasSpeakerSystems = computed(() => !!allSpeakerSystems.value.length)
  const managingSpeakerSystems = computed(() =>
    getSystems(meeting.value, (system) => !!isSystemModerator(system))
  )

  return {
    activeSpeakerSystems,
    allSpeakerSystems,
    hasSpeakerSystems,
    managingSpeakerSystems
  }
}
