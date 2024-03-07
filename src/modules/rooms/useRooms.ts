import { Ref, computed, reactive } from 'vue'
import { IMeetingRoom, IRoomHighlight, ProposalHighlight } from './types'
import { roomType } from './contentTypes'
import { Predicate, filter } from 'itertools'
import { speakerSystems } from '../speakerLists/useSpeakerLists'
import { SpeakerSystem, SpeakerSystemState } from '../speakerLists/types'
import { isSystemModerator } from '../speakerLists/rules'
import { proposalHighlightEvent } from './events'

export const meetingRoomStore = reactive(new Map<number, IMeetingRoom>())
export const highlightedStore = reactive(new Map<number, IRoomHighlight>())

roomType
  .updateMap(meetingRoomStore, { meeting: 'meeting' })
  .on<IRoomHighlight>('highlighted', (data) =>
    highlightedStore.set(data.pk, data)
  )
  .on<ProposalHighlight>('marked', (selection) =>
    proposalHighlightEvent.emit(selection)
  )

function* iterSpeakerSystems(
  meeting: number,
  predicate?: Predicate<SpeakerSystem>
) {
  for (const system of speakerSystems.values()) {
    if (system.meeting !== meeting) continue
    if (!predicate || predicate(system)) yield system
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
