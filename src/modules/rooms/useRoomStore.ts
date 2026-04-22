import { type Predicate, any, filter } from 'itertools'
import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import { useSessionStorage } from '@vueuse/core'

import { generateToken } from '@/utils'

import { roomType } from './contentTypes'
import { proposalHighlightEvent } from './events'
import type { IMeetingRoom, IRoomHighlight, ProposalHighlight } from './types'

export default defineStore('rooms', () => {
  const meetingRooms = reactive(new Map<number, IMeetingRoom>())
  const highlights = reactive(new Map<number, IRoomHighlight>())
  const roomTokens = useSessionStorage('room:tokens', new Map<number, string>())

  roomType
    .updateMap(meetingRooms, { meeting: 'meeting' })
    .on<IRoomHighlight>('highlighted', (data) => highlights.set(data.pk, data))
    .on<ProposalHighlight>('marked', (selection) =>
      proposalHighlightEvent.emit(selection)
    )

  // Complicated way to check room tokens :)
  watch(meetingRooms, (rooms) => {
    if (!roomTokens.value.size) return
    for (const { pk, token } of rooms.values()) {
      if (!token) continue
      const myToken = roomTokens.value.get(pk)
      if (myToken && myToken !== token) roomTokens.value.delete(pk)
    }
  })

  function getHighlighted(room: number) {
    return highlights.get(room)
  }

  function getRoom(room: number) {
    return meetingRooms.get(room)
  }

  function hasRoomToken(room: number) {
    return roomTokens.value.has(room)
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
    // Get existing token, or generate new
    const token = roomTokens.value.get(room) ?? generateToken()
    const { data } = await roomType.api.action<RoomHandleData>(
      room,
      'handle',
      { ...values, token },
      'patch'
    )
    // Save token after request is successful.
    roomTokens.value.set(room, token)
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
