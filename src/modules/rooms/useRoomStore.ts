import { type Predicate, any, filter } from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { roomType } from './contentTypes'
import { proposalHighlightEvent } from './events'
import type { IMeetingRoom, IRoomHighlight, ProposalHighlight } from './types'

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

  return {
    anyRoom,
    filterRooms,
    getHighlighted,
    getRoom
  }
})
