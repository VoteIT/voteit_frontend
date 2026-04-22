import { type Predicate, any, filter } from 'itertools'
import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

import { generateToken } from '@/utils'

import { roomType } from './contentTypes'
import { proposalHighlightEvent } from './events'
import type { IMeetingRoom, IRoomHighlight, ProposalHighlight } from './types'

export default defineStore('rooms', () => {
  const meetingRooms = reactive(new Map<number, IMeetingRoom>())
  const highlights = reactive(new Map<number, IRoomHighlight>())
  const roomTokens = reactive(new Map<number, string>())

  roomType
    .updateMap(meetingRooms, { meeting: 'meeting' })
    .on<IRoomHighlight>('highlighted', (data) => highlights.set(data.pk, data))
    .on<ProposalHighlight>('marked', (selection) =>
      proposalHighlightEvent.emit(selection)
    )

  // Complicated way to check room tokens :)
  watch(meetingRooms, (rooms) => {
    if (!roomTokens.size) return
    for (const { pk, token } of rooms.values()) {
      if (!token) continue
      const myToken = roomTokens.get(pk)
      if (myToken && myToken !== token) roomTokens.delete(pk)
    }
  })

  function getHighlighted(room: number) {
    return highlights.get(room)
  }

  function getRoom(room: number) {
    return meetingRooms.get(room)
  }

  /**
   * Will generate a new token if none found
   */
  function getRoomToken(room: number) {
    if (!roomTokens.has(room)) roomTokens.set(room, generateToken())
    return roomTokens.get(room)!
  }

  function hasRoomToken(room: number) {
    return roomTokens.has(room)
  }

  function anyRoom(predicate: Predicate<IMeetingRoom>) {
    return any(meetingRooms.values(), predicate)
  }

  function filterRooms(predicate: Predicate<IMeetingRoom>) {
    return filter(meetingRooms.values(), predicate)
  }

  type RoomHandleData = Pick<
    IMeetingRoom,
    'poll' | 'agenda_item' | 'send_proposals' | 'show_ballot'
  > & {
    highlighted?: number[]
  }

  async function handleRoom(room: number, values: Partial<RoomHandleData>) {
    const { data } = await roomType.api.action<RoomHandleData>(
      room,
      'handle',
      { ...values, token: getRoomToken(room) },
      'patch'
    )
    // Update data from response
    const { highlighted, ...partial } = data
    if (highlighted) highlights.set(room, { pk: room, highlighted })
    const _room = meetingRooms.get(room)
    if (_room) meetingRooms.set(room, { ..._room, ...partial })
  }

  type SpeakerHandleData = Pick<
    IMeetingRoom,
    'body' | 'open' | 'show_time' | 'send_sls'
  >

  async function handleSpeaker(
    room: number,
    values: Partial<SpeakerHandleData>
  ) {
    const { data } = await roomType.api.action<SpeakerHandleData>(
      room,
      'handle-speaker',
      values,
      'patch'
    )
    // Update data from response
    const _room = meetingRooms.get(room)
    if (_room) meetingRooms.set(room, { ..._room, ...data })
  }

  return {
    anyRoom,
    filterRooms,
    getHighlighted,
    getRoom,
    handleRoom,
    handleSpeaker,
    hasRoomToken
  }
})
