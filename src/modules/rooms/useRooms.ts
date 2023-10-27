import { Ref, computed, reactive } from 'vue'
import { IMeetingRoom, IRoomHighlight } from './types'
import { roomType } from './contentTypes'
import { filter } from 'itertools'

export const meetingRoomStore = reactive(new Map<number, IMeetingRoom>())
export const highlightedStore = reactive(new Map<number, IRoomHighlight>())

roomType
  .updateMap(meetingRoomStore, { meeting: 'meeting' })
  .on<IRoomHighlight>('highlighted', (data) =>
    highlightedStore.set(data.pk, data)
  )

export default function useRooms(meeting: Ref<number>) {
  const meetingRooms = computed(() =>
    filter(meetingRoomStore.values(), (r) => r.meeting === meeting.value)
  )

  return {
    meetingRooms
  }
}
