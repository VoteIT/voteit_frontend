import { Ref, computed, reactive } from 'vue'
import { IMeetingRoom, IRoomHighlight } from './types'
import { roomType } from './contentTypes'
import { filter } from 'itertools'
import useSpeakerLists from '../speakerLists/useSpeakerLists'
import { SpeakerSystem, SpeakerSystemState } from '../speakerLists/types'
import { isSystemModerator } from '../speakerLists/rules'

export const meetingRoomStore = reactive(new Map<number, IMeetingRoom>())
export const highlightedStore = reactive(new Map<number, IRoomHighlight>())

roomType
  .updateMap(meetingRoomStore, { meeting: 'meeting' })
  .on<IRoomHighlight>('highlighted', (data) =>
    highlightedStore.set(data.pk, data)
  )

const { getSystem } = useSpeakerLists()

function* iterSpeakerSystems(
  meeting: number,
  filter?: (system: SpeakerSystem) => boolean
) {
  for (const room of meetingRoomStore.values()) {
    if (!room.sls || room.meeting !== meeting) continue
    const sls = getSystem(room.sls)
    if (!sls || (filter && !filter(sls))) continue
    yield {
      room,
      ...sls
    }
  }
}

export default function useRooms(meeting: Ref<number>) {
  const meetingRooms = computed(() =>
    filter(meetingRoomStore.values(), (r) => r.meeting === meeting.value)
  )

  const activeSpeakerSystems = computed(() => [
    ...iterSpeakerSystems(
      meeting.value,
      (system) => system.state === SpeakerSystemState.Active
    )
  ])
  const allSpeakerSystems = computed(() => [
    ...iterSpeakerSystems(meeting.value)
  ])
  const managingSpeakerSystems = computed(() => [
    ...iterSpeakerSystems(
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
