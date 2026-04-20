import { isEqual } from 'lodash'
import { computed } from 'vue'
import { RouteLocationNamedRaw, useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'

import useChannel from '@/composables/useChannel'
import useAuthStore from '../auth/useAuthStore'
import usePoll from '../polls/usePoll'
import useProposalStore from '../proposals/useProposalStore'
import { SpeakerSystemState } from '../speakerLists/types'
import useSpeakerStore from '../speakerLists/useSpeakerStore'

import useRoomStore from './useRoomStore'
import { roomType } from './contentTypes'

/**
 * Set client to passive mode to disable interaction in real-time view (no speaker registration or voting)
 * Used when connecting computer to projector.
 */
const passiveMode = useStorage('room:passiveMode', false)

const textSize = useStorage<'normal' | 'large' | 'x-large'>(
  'room.textSize',
  'normal'
)

export default function useRoom() {
  const authStore = useAuthStore()
  const store = useRoomStore()
  const { findSpeakerSystem } = useSpeakerStore()
  const proposalStore = useProposalStore()
  const route = useRoute()
  const roomId = computed(() => Number(route.params.roomId))
  useChannel('room', roomId)

  const meetingRoom = computed(() => store.getRoom(roomId.value))
  const highlighted = computed(
    () => store.getHighlighted(roomId.value)?.highlighted
  )
  const highlightedProposals = computed(() =>
    highlighted.value ? proposalStore.getProposals(highlighted.value) : []
  )

  /**
   * Is anyone broadcasting?
   */
  const hasBroadcast = computed(() => {
    if (!meetingRoom.value) return false
    return meetingRoom.value.open && meetingRoom.value.send_proposals
  })

  /**
   * Is current user broadcasting?
   */
  const isBroadcasting = computed(() => {
    if (!meetingRoom.value) return false
    return (
      hasBroadcast.value && meetingRoom.value.handler === authStore.user?.pk
    )
  })

  /**
   * Use this to react and open selected poll in real-time view.
   */
  const { poll: roomOpenPoll } = usePoll(
    computed(() => meetingRoom.value?.poll ?? 0)
  )

  async function setOpen(open: boolean) {
    await roomType.api.patch(roomId.value, { open })
  }

  /**
   * Wrapper to handle room broadcast (proposal tab)
   */
  function handleBroadcast(
    values: Parameters<(typeof store)['handleRoom']>[1]
  ) {
    return store.handleRoom(roomId.value, values)
  }

  /**
   * Wrapper to handle room speaker lists (speaker tab)
   */
  function handleSpeaker(
    values: Parameters<(typeof store)['handleSpeaker']>[1]
  ) {
    return store.handleSpeaker(roomId.value, values)
  }

  const speakerSystem = computed(() =>
    findSpeakerSystem((s) => s.room === roomId.value)
  )
  const hasSpeakerLists = computed(
    () => speakerSystem.value?.state === SpeakerSystemState.Active
  )

  function getRoomRoute(
    name: 'room:broadcast' | 'room:main',
    params?: {
      aid?: number
      id?: number
      roomId?: number
      tab?: 'decisions' | 'discussion'
    }
  ): RouteLocationNamedRaw {
    return {
      name,
      params: {
        roomId: roomId.value,
        id: meetingRoom.value?.meeting,
        ...params
      }
    }
  }

  const realTimeRoute = computed(() => getRoomRoute('room:main'))

  return {
    hasBroadcast,
    hasSpeakerLists,
    highlighted,
    highlightedProposals,
    isBroadcasting,
    meetingRoom,
    passiveMode,
    realTimeRoute,
    roomId,
    roomOpenPoll,
    speakerSystem,
    textSize,
    getRoomRoute,
    handleBroadcast,
    handleSpeaker,
    setOpen
  }
}
