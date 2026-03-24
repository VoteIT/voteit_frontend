import { type Predicate, any, filter } from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { IMeetingRoom, IRoomHighlight, ProposalHighlight } from './types'
import { roomType } from './contentTypes'
import { speakerSystems } from '../speakerLists/useSpeakerLists'
import { SpeakerSystem } from '../speakerLists/types'
import { proposalHighlightEvent } from './events'

export default defineStore('rooms', () => {
  const meetingRooms = reactive(new Map<number, IMeetingRoom>())
  const highlights = reactive(new Map<number, IRoomHighlight>())

  roomType
    .updateMap(meetingRooms, { meeting: 'meeting' })
    .on<IRoomHighlight>('highlighted', (data) => highlights.set(data.pk, data))
    .on<ProposalHighlight>('marked', (selection) =>
      proposalHighlightEvent.emit(selection)
    )

  function getHighlighted(room: number) {
    return highlights.get(room)
  }

  function getRoom(room: number) {
    return meetingRooms.get(room)
  }

  function anyRoom(predicate: Predicate<IMeetingRoom>) {
    return any(meetingRooms.values(), predicate)
  }

  function filterRooms(predicate: Predicate<IMeetingRoom>) {
    return filter(meetingRooms.values(), predicate)
  }

  function* iterSpeakerSystems(
    meeting: number,
    predicate?: Predicate<SpeakerSystem>
  ) {
    for (const system of speakerSystems.values()) {
      if (system.meeting !== meeting) continue
      if (!predicate || predicate(system)) yield system
    }
  }

  return {
    anyRoom,
    filterRooms,
    getHighlighted,
    getRoom,
    iterSpeakerSystems
  }
})
