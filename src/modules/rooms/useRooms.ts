import { Ref, computed } from 'vue'

import { SpeakerSystemState } from '../speakerLists/types'
import { isSystemModerator } from '../speakerLists/rules'
import useRoomStore from './useRoomStore'

export default function useRooms(meeting: Ref<number>) {
  const store = useRoomStore()

  const meetingRooms = computed(() =>
    store.filterRooms((r) => r.meeting === meeting.value)
  )

  const activeSpeakerSystems = computed(() => [
    ...store.iterSpeakerSystems(
      meeting.value,
      (system) => system.state === SpeakerSystemState.Active
    )
  ])
  const allSpeakerSystems = computed(() => [
    ...store.iterSpeakerSystems(meeting.value)
  ])
  const managingSpeakerSystems = computed(() => [
    ...store.iterSpeakerSystems(
      meeting.value,
      (system) =>
        system.state === SpeakerSystemState.Active &&
        !!isSystemModerator(system)
    )
  ])

  return {
    activeSpeakerSystems,
    allSpeakerSystems,
    managingSpeakerSystems,
    meetingRooms
  }
}
