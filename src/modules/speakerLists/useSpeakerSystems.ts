import { computed, Ref } from 'vue'
import { isSystemModerator } from './rules'
import { SpeakerSystemState } from './types'
import { getSpeakerSystems } from './useSpeakerLists'

export default function useSpeakerSystems(meeting: Ref<number>) {
  const activeSpeakerSystems = computed(() =>
    getSpeakerSystems(
      meeting.value,
      (system) => system.state === SpeakerSystemState.Active
    )
  )
  const allSpeakerSystems = computed(() => getSpeakerSystems(meeting.value))
  const hasSpeakerSystems = computed(() => !!allSpeakerSystems.value.length)
  const managingSpeakerSystems = computed(() =>
    getSpeakerSystems(meeting.value, (system) => !!isSystemModerator(system))
  )

  return {
    activeSpeakerSystems,
    allSpeakerSystems,
    hasSpeakerSystems,
    managingSpeakerSystems
  }
}
