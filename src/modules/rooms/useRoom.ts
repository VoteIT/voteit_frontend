import { isEqual } from 'lodash'
import { computed } from 'vue'
import { RouteLocationNamedRaw, useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'

import useChannel from '@/composables/useChannel'
import useAuthStore from '../auth/useAuthStore'
import usePoll from '../polls/usePoll'
import { getProposals } from '../proposals/useProposals'
import { findSpeakerSystem } from '../speakerLists/useSpeakerLists'
import { SpeakerSystemState } from '../speakerLists/types'

import { highlightedStore, meetingRoomStore } from './useRooms'
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
  const route = useRoute()
  const roomId = computed(() => Number(route.params.roomId))
  useChannel('room', roomId)

  const meetingRoom = computed(() => meetingRoomStore.get(roomId.value))
  const highlighted = computed(
    () => highlightedStore.get(roomId.value)?.highlighted
  )
  const highlightedProposals = computed(() =>
    highlighted.value ? getProposals(highlighted.value) : []
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

  /**
   * Set broadcasted poll. Should always be called when starting poll in plenary view.
   */
  function setPoll(poll: number | null) {
    return roomType.api.action(roomId.value, 'handle', { poll }, 'patch')
  }

  async function setOpen(open: boolean) {
    await roomType.update(roomId.value, { open })
  }

  function setShowBallot(show_ballot: boolean) {
    return roomType.update(roomId.value, { show_ballot })
  }

  async function setBroadcast(content?: {
    agenda_item?: number
    highlighted: number[]
  }) {
    if (!authStore.user)
      throw new Error(
        'No authenticated user available when trying to set broadcast'
      )
    if (!meetingRoom.value)
      throw new Error(
        `No meeting room data available for room ${roomId.value} when trying to set broadcast`
      )
    const { handler, open, send_proposals } = meetingRoom.value
    // Make sure broadcast is on
    if (!open || !send_proposals)
      await roomType.update(roomId.value, {
        open: true,
        send_proposals: true
      })
    // Make sure user is handler
    if (handler !== authStore.user?.pk) await setHandler()
    // Set content
    if (content)
      await roomType.api.action(roomId.value, 'handle', content, 'patch')
  }

  /**
   * Sets current user as handler.
   */
  function setHandler() {
    return roomType.api.action(roomId.value, 'set-handler')
  }

  async function setProposalBroadcast(active = true) {
    await roomType.update(roomId.value, { send_proposals: active })
  }

  async function setSlsBroadcast(active = true) {
    await roomType.update(roomId.value, { send_sls: active })
  }

  async function setHighlightedProposals(proposalIds: number[]) {
    if (isEqual(proposalIds, highlighted.value)) return
    await roomType.api.action(
      roomId.value,
      'handle',
      { highlighted: proposalIds },
      'patch'
    )
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
    setBroadcast,
    setHandler,
    setOpen,
    setPoll,
    setProposalBroadcast,
    setSlsBroadcast,
    setShowBallot,
    setHighlightedProposals
  }
}
