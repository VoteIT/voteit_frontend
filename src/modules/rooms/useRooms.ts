import { Ref, computed } from 'vue'

import { SpeakerSystemState } from '../speakerLists/types'
import { isSystemModerator } from '../speakerLists/rules'
import useSpeakerStore from '../speakerLists/useSpeakerStore'
import useRoomStore from './useRoomStore'

export default function useRooms(meeting: Ref<number>) {
  const store = useRoomStore()
  const { getSpeakerSystems } = useSpeakerStore()

  const meetingRooms = computed(() =>
    store.filterRooms((r) => r.meeting === meeting.value)
  )

  const activeSpeakerSystems = computed(() =>
    getSpeakerSystems(
      meeting.value,
      (system) => system.state === SpeakerSystemState.Active
    )
  )
  const allSpeakerSystems = computed(() => getSpeakerSystems(meeting.value))
  const managingSpeakerSystems = computed(() =>
    getSpeakerSystems(
      meeting.value,
      (system) =>
        system.state === SpeakerSystemState.Active &&
        !!isSystemModerator(system)
    )
  )

  return {
    activeSpeakerSystems,
    allSpeakerSystems,
    managingSpeakerSystems,
    meetingRooms
  }
}
